import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { AwsService } from '../../services/aws.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-aws-setup',
  templateUrl: './aws-setup.component.html',
  styleUrls: ['./aws-setup.component.css'],
  standalone: false
})
export class AwsSetupComponent implements OnInit {
  appAccountId: string = '';
  externalId: string = '';
  roleArnInput: string = '';
  
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private awsService: AwsService, 
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    // FIXED: Method name changed to getAwsSetupInfo()
    this.awsService.getAwsSetupInfo().subscribe({
      // FIXED: Added ': any' to res
      next: (res: any) => {
        console.log("SUCCESS DATA FROM BACKEND:", res);
        this.appAccountId = res.appAccountId;
        this.externalId = res.externalId;
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      // FIXED: Added ': any' to err
      error: (err: any) => {
        console.error("ERROR FROM BACKEND:", err);
        this.errorMessage = 'Failed to load setup instructions. Are you logged in?';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (!this.roleArnInput) return;

    this.awsService.saveRoleArn(this.roleArnInput).subscribe({
      // FIXED: Added ': any' to res
      next: (res: any) => {
        alert('AWS Role Connected Successfully!');
        this.router.navigate(['/dashboard']); 
      },
      // FIXED: Added ': any' to err
      error: (err: any) => {
        this.errorMessage = err.error.error || 'Failed to save Role ARN.';
        this.cdr.detectChanges(); 
      }
    });
  }
}