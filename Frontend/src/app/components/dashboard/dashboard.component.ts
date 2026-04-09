import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { AwsService } from '../../services/aws.service';
import cytoscape from 'cytoscape'; 
import * as DOMPurify from 'dompurify';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  awsData: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  private cy: cytoscape.Core | null = null;

  // --- NEW: List of available regions ---
  availableRegions = [
    { id: 'us-east-1', name: 'US East (N. Virginia)' },
    { id: 'us-east-2', name: 'US East (Ohio)' },
    { id: 'us-west-1', name: 'US West (N. California)' },
    { id: 'us-west-2', name: 'US West (Oregon)' },
    { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
    { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
    { id: 'ap-northeast-2', name: 'Asia Pacific (Seoul)' },
    { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
    { id: 'ap-southeast-2', name: 'Asia Pacific (Sydney)' },
    { id: 'ca-central-1', name: 'Canada (Central)' },
    { id: 'eu-central-1', name: 'Europe (Frankfurt)' },
    { id: 'eu-west-1', name: 'Europe (Ireland)' },
    { id: 'eu-west-2', name: 'Europe (London)' },
    { id: 'sa-east-1', name: 'South America (São Paulo)' }
  ];
  selectedRegion = 'ap-south-1'; // Default region

  readonly awsIcons = {
    ec2: 'assets/aws-icons/ec2.png',
    rds: 'assets/aws-icons/rds.png',
    igw: 'assets/aws-icons/igw.png',
    nat: 'assets/aws-icons/nat.png',
    ebs: 'assets/aws-icons/ebs.png',
    sg: 'assets/aws-icons/sg.png'
  };

  @ViewChild('cyContainer', { static: false }) cyContainer!: ElementRef;

  constructor(
    private awsService: AwsService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  // --- NEW: Function to handle region changes ---
  onRegionChange(event: any): void {
    this.selectedRegion = event.target.value;
    this.fetchData();
  }

  // --- NEW: Extracted fetching logic ---
  private fetchData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.awsData = null;
    
    // Pass the selected region to the service
    this.awsService.getInfrastructure(this.selectedRegion).subscribe({
      next: (res) => {
        this.awsData = res.data;
        this.isLoading = false;
        this.cdr.detectChanges(); 
        
        setTimeout(() => this.initGraph(), 50);
      },
      error: (err) => {
        console.error("FAILED TO FETCH AWS DATA:", err);
        this.errorMessage = err.error?.error || 'Failed to fetch AWS infrastructure. Check console.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  zoomIn() {
    if (this.cy) {
      this.cy.zoom(this.cy.zoom() * 1.25);
      this.cy.center();
    }
  }

  zoomOut() {
    if (this.cy) {
      this.cy.zoom(this.cy.zoom() * 0.8);
      this.cy.center();
    }
  }

  fitGraph() {
    if (this.cy) {
      this.cy.fit(undefined, 50);
      this.cy.center();
    }
  }

  private initGraph(): void {
    if (!this.cyContainer || !this.awsData) return;

    try {
      const purify = (DOMPurify as any).default || DOMPurify;
      
      const rawNodes = this.awsData.nodes || [];
      const rawEdges = this.awsData.edges || [];

      const nodeMap = new Map();
      rawNodes.forEach((n: any) => nodeMap.set(n.id, n));

      rawNodes.forEach((n: any) => {
        if (n.type === 'EBS' && !n.parentId) {
          const attachedEdge = rawEdges.find((e: any) => e.source === n.id || e.target === n.id);
          
          if (attachedEdge) {
            const connectedNodeId = attachedEdge.source === n.id ? attachedEdge.target : attachedEdge.source;
            const connectedNode = nodeMap.get(connectedNodeId);
            
            if (connectedNode && connectedNode.parentId) {
              n.parentId = connectedNode.parentId;
            }
          }
        }
      });

      const validNodeIds = new Set(rawNodes.map((n: any) => n.id));

      const nodes = rawNodes.map((n: any) => {
        let safeParent = n.parentId ? purify.sanitize(n.parentId) : undefined;
        
        if (safeParent && !validNodeIds.has(safeParent)) {
          safeParent = undefined;
        }

        let displayLabel = n.label ? purify.sanitize(n.label) : purify.sanitize(n.id);
        
        if (n.type === 'VPC' && n.cidr) {
          displayLabel += `\n(${purify.sanitize(n.cidr)})`;
        }
        
        if (n.type === 'EC2' && n.publicIp) {
          displayLabel += `\nIP: ${purify.sanitize(n.publicIp)}`;
        }

        return {
          data: {
            id: purify.sanitize(n.id),
            label: displayLabel,
            type: n.type ? purify.sanitize(n.type) : 'Unknown',
            parent: safeParent,
            status: n.status ? purify.sanitize(n.status) : 'unknown'
          }
        };
      });

      const edges = rawEdges.map((e: any) => ({
        data: {
          id: purify.sanitize(e.id),
          source: purify.sanitize(e.source),
          target: purify.sanitize(e.target),
          relation: e.relation ? purify.sanitize(e.relation) : '',
          label: e.relation ? purify.sanitize(e.relation) : ''
        }
      }));

      if (this.cy) {
        this.cy.destroy();
      }

      this.cy = cytoscape({
        container: this.cyContainer.nativeElement,
        elements: { nodes, edges },
        minZoom: 0.2, 
        maxZoom: 3.0, 
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'text-wrap': 'wrap', 
              'text-valign': 'bottom',
              'text-margin-y': 8,
              'color': '#16191f',
              'font-size': '12px', 
              'font-family': '"Amazon Ember", "Helvetica Neue", Helvetica, Arial, sans-serif',
              'font-weight': 600,
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.8,
              'text-background-padding': '4px',
              'text-background-shape': 'roundrectangle'
            }
          },
          {
            selector: 'node[type="VPC"]',
            style: {
              'shape': 'round-rectangle',
              'background-color': '#ffffff',
              'background-opacity': 0.4,
              'border-color': '#3F8624', 
              'border-width': 2,
              'border-style': 'solid',
              'text-valign': 'top',
              'text-margin-y': -8,
              'padding': '40px'
            }
          },
          {
            selector: 'node[type="Subnet"]',
            style: {
              'shape': 'round-rectangle',
              'background-color': '#ffffff',
              'background-opacity': 0.6,
              'border-color': '#00A4A6', 
              'border-width': 2,
              'border-style': 'dashed',
              'text-valign': 'top',
              'text-margin-y': -8,
              'padding': '25px'
            }
          },
          {
            selector: 'node[type="InternetGateway"], node[type="NATGateway"], node[type="EC2"], node[type="RDS"], node[type="SecurityGroup"], node[type="EBS"]',
            style: {
              'shape': 'rectangle',
              'background-opacity': 0, 
              'border-width': 0,       
              'width': 48, 
              'height': 48,
              'background-fit': 'contain'
            }
          },
          { selector: 'node[type="InternetGateway"]', style: { 'background-image': this.awsIcons.igw } },
          { selector: 'node[type="NATGateway"]', style: { 'background-image': this.awsIcons.nat } },
          { selector: 'node[type="EC2"]', style: { 'background-image': this.awsIcons.ec2 } },
          { selector: 'node[type="RDS"]', style: { 'background-image': this.awsIcons.rds } },
          { selector: 'node[type="SecurityGroup"]', style: { 'background-image': this.awsIcons.sg } },
          { selector: 'node[type="EBS"]', style: { 'background-image': this.awsIcons.ebs } },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#aab7c4',
              'target-arrow-color': '#aab7c4',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '10px',
              'font-family': '"Amazon Ember", "Helvetica Neue", Helvetica, Arial, sans-serif',
              'text-rotation': 'autorotate',
              'color': '#555',
              'text-background-color': '#fff',
              'text-background-opacity': 0.8
            }
          },
          {
            selector: 'edge[relation="attached_to_vpc"]',
            style: {
              'display': 'none'
            }
          }
        ],
        layout: {
          name: 'cose',
          padding: 50,
          spacingFactor: 1.3, 
          animate: true,
          animationDuration: 500
        }
      });

      const repositionIGWs = () => {
        if (!this.cy) return;
        this.cy.nodes('[type="InternetGateway"]').forEach((igw) => {
          const connectedEdges = igw.connectedEdges('[relation="attached_to_vpc"]');
          if (connectedEdges.length > 0) {
            const vpcId = connectedEdges[0].data('target');
            const vpc = this.cy!.getElementById(vpcId);
            if (vpc && vpc.length > 0) {
              const vpcBox = vpc.boundingBox();
              igw.position({
                x: vpcBox.x1 + (vpcBox.w / 2),
                y: vpcBox.y1
              });
            }
          }
        });
      };

      this.cy.on('layoutstop', () => {
        repositionIGWs();
        if (this.cy && this.cy.zoom() < 0.7) {
          this.cy.zoom(0.85);
          this.cy.center();
        }
      });

      this.cy.on('position', 'node[type != "InternetGateway"]', () => {
        repositionIGWs();
      });

    } catch (error) {
      console.error("CYTOSCAPE CRASHED DURING RENDER:", error);
      this.errorMessage = "Data loaded, but the graph crashed while rendering. Please check the browser console.";
      this.cdr.detectChanges();
    }
  }
}