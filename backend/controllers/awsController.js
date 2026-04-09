const db = require('../config/db');
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');
const { 
    EC2Client, 
    DescribeInstancesCommand, 
    DescribeVpcsCommand,
    DescribeSubnetsCommand,
    DescribeSecurityGroupsCommand,
    DescribeVolumesCommand,
    DescribeNatGatewaysCommand,       
    DescribeInternetGatewaysCommand   
} = require('@aws-sdk/client-ec2');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');

const stsClient = new STSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY
    }
});

const getNameFromTags = (tags, fallbackId) => {
    if (!tags) return fallbackId;
    const nameTag = tags.find(t => t.Key === 'Name');
    return nameTag ? nameTag.Value : fallbackId;
};

exports.getAwsSetupInfo = async (req, res) => {
    try {
        const result = await db.query('SELECT aws_external_id FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: "User not found." });

        res.status(200).json({
            appAccountId: process.env.APP_AWS_ACCOUNT_ID, 
            externalId: result.rows[0].aws_external_id    
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch AWS setup info." });
    }
};

exports.saveRoleArn = async (req, res) => {
    try {
        const { roleArn } = req.body;
        if (!roleArn) return res.status(400).json({ error: "Role ARN is required." });

        await db.query('UPDATE users SET aws_role_arn = $1 WHERE id = $2', [roleArn, req.userId]);
        res.status(200).json({ message: "AWS Role connected successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save Role ARN." });
    }
};

exports.fetchAwsInfrastructure = async (req, res) => {
    try {
        const userResult = await db.query('SELECT aws_role_arn, aws_external_id FROM users WHERE id = $1', [req.userId]);
        const user = userResult.rows[0];

        if (!user.aws_role_arn) return res.status(400).json({ error: "AWS account not connected yet." });

        const assumedRole = await stsClient.send(new AssumeRoleCommand({
            RoleArn: user.aws_role_arn,
            RoleSessionName: `VisualizationApp-Session-${req.userId}`,
            ExternalId: user.aws_external_id,
            DurationSeconds: 900
        }));
        
        const tempCredentials = {
            accessKeyId: assumedRole.Credentials.AccessKeyId,
            secretAccessKey: assumedRole.Credentials.SecretAccessKey,
            sessionToken: assumedRole.Credentials.SessionToken
        };

        // --- NEW: Dynamic Region Support ---
        const TARGET_REGION = req.query.region || 'ap-south-1'; 
        const targetClientConfig = { region: TARGET_REGION, credentials: tempCredentials };
        
        const targetEc2Client = new EC2Client(targetClientConfig);
        const targetS3Client = new S3Client(targetClientConfig);
        const targetRdsClient = new RDSClient(targetClientConfig);

        // FETCHING ALL RESOURCE TYPES CONCURRENTLY
        const [ec2Data, vpcData, subnetData, sgData, ebsData, natData, igwData, s3Data, rdsData] = await Promise.all([
            targetEc2Client.send(new DescribeInstancesCommand({})),
            targetEc2Client.send(new DescribeVpcsCommand({})),
            targetEc2Client.send(new DescribeSubnetsCommand({})),
            targetEc2Client.send(new DescribeSecurityGroupsCommand({})),
            targetEc2Client.send(new DescribeVolumesCommand({})),
            targetEc2Client.send(new DescribeNatGatewaysCommand({})),       
            targetEc2Client.send(new DescribeInternetGatewaysCommand({})),  
            targetS3Client.send(new ListBucketsCommand({})), 
            targetRdsClient.send(new DescribeDBInstancesCommand({}))
        ]);

        const nodes = [];
        const edges = [];

        // 1. Map VPCs
        if (vpcData.Vpcs) {
            vpcData.Vpcs.forEach(vpc => {
                nodes.push({
                    id: vpc.VpcId,
                    label: getNameFromTags(vpc.Tags, vpc.VpcId),
                    type: 'VPC',
                    status: vpc.State,
                    cidr: vpc.CidrBlock
                });
            });
        }

        // 2. Map Subnets
        if (subnetData.Subnets) {
            subnetData.Subnets.forEach(subnet => {
                nodes.push({
                    id: subnet.SubnetId,
                    label: getNameFromTags(subnet.Tags, subnet.SubnetId),
                    type: 'Subnet',
                    status: subnet.State,
                    parentId: subnet.VpcId 
                });
            });
        }

        // 3. Map Internet Gateways
        if (igwData.InternetGateways) {
            igwData.InternetGateways.forEach(igw => {
                nodes.push({
                    id: igw.InternetGatewayId,
                    label: getNameFromTags(igw.Tags, igw.InternetGatewayId),
                    type: 'InternetGateway'
                });

                if (igw.Attachments) {
                    igw.Attachments.forEach(att => {
                        edges.push({
                            id: `edge-${igw.InternetGatewayId}-${att.VpcId}`,
                            source: igw.InternetGatewayId,
                            target: att.VpcId,
                            relation: 'attached_to_vpc'
                        });
                    });
                }
            });
        }

        // 4. Map NAT Gateways
        if (natData.NatGateways) {
            natData.NatGateways.forEach(nat => {
                nodes.push({
                    id: nat.NatGatewayId,
                    label: getNameFromTags(nat.Tags, nat.NatGatewayId),
                    type: 'NATGateway',
                    status: nat.State,
                    parentId: nat.SubnetId 
                });
            });
        }

        // 5. Map Security Groups
        if (sgData.SecurityGroups) {
            sgData.SecurityGroups.forEach(sg => {
                nodes.push({
                    id: sg.GroupId,
                    label: sg.GroupName || sg.GroupId,
                    type: 'SecurityGroup',
                    parentId: sg.VpcId
                });
            });
        }

        // 6. Map EC2 Instances
        if (ec2Data.Reservations) {
            ec2Data.Reservations.forEach(resItem => {
                if (resItem.Instances) {
                    resItem.Instances.forEach(inst => {
                        nodes.push({
                            id: inst.InstanceId,
                            label: getNameFromTags(inst.Tags, inst.InstanceId),
                            type: 'EC2',
                            status: inst.State?.Name || 'unknown',
                            parentId: inst.SubnetId || inst.VpcId,
                            publicIp: inst.PublicIpAddress
                        });

                        if (inst.SecurityGroups) {
                            inst.SecurityGroups.forEach(sg => {
                                edges.push({
                                    id: `edge-${sg.GroupId}-${inst.InstanceId}`,
                                    source: sg.GroupId,
                                    target: inst.InstanceId,
                                    relation: 'protects'
                                });
                            });
                        }
                    });
                }
            });
        }

        // 7. Map EBS Volumes
        if (ebsData.Volumes) {
            ebsData.Volumes.forEach(vol => {
                nodes.push({
                    id: vol.VolumeId,
                    label: getNameFromTags(vol.Tags, vol.VolumeId),
                    type: 'EBS',
                    size: `${vol.Size}GB`,
                    status: vol.State
                });

                if (vol.Attachments) {
                    vol.Attachments.forEach(att => {
                        edges.push({
                            id: `edge-${vol.VolumeId}-${att.InstanceId}`,
                            source: vol.VolumeId,
                            target: att.InstanceId,
                            relation: 'attached_to'
                        });
                    });
                }
            });
        }

        // 8. Map RDS Instances
        if (rdsData.DBInstances) {
            rdsData.DBInstances.forEach(db => {
                const parentId = (db.DBSubnetGroup && db.DBSubnetGroup.Subnets && db.DBSubnetGroup.Subnets.length > 0) 
                    ? db.DBSubnetGroup.Subnets[0].SubnetIdentifier 
                    : db.DBSubnetGroup?.VpcId;

                nodes.push({
                    id: db.DBInstanceIdentifier,
                    label: db.DBInstanceIdentifier,
                    type: 'RDS',
                    status: db.DBInstanceStatus,
                    parentId: parentId
                });
            });
        }

        // 9. Map S3 Buckets
        if (s3Data.Buckets) {
            s3Data.Buckets.forEach(bucket => {
                nodes.push({
                    id: bucket.Name,
                    label: bucket.Name,
                    type: 'S3'
                });
            });
        }

        res.status(200).json({
            message: `Successfully fetched infrastructure for region ${TARGET_REGION}!`,
            data: {
                nodes: nodes,
                edges: edges
            }
        });

    } catch (error) {
        console.error("STS / Resource Fetch Error:", error);
        res.status(403).json({ error: "Failed to access target AWS account or fetch region data." });
    }
};