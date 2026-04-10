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
  auth0UserId: string = '';
  roleArnInput: string = '';
  
  isLoading: boolean = true;
  errorMessage: string = '';

  isConnected: boolean = false;
  existingArn: string = '';

  constructor(
    private awsService: AwsService, 
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    // First, check if they are already connected
    this.awsService.checkConnection().subscribe({
      next: (res: any) => {
        if (res.isConnected) {
          this.isConnected = true;
          this.existingArn = res.roleArn;
        }
        this.fetchSetupInstructions();
      },
      error: (err: any) => {
        this.fetchSetupInstructions(); // fallback
      }
    });
  }

  fetchSetupInstructions() {
    this.awsService.getAwsSetupInfo().subscribe({
      next: (res: any) => {
        this.auth0UserId = res.auth0UserId;
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to load setup instructions. Are you logged in?';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (!this.roleArnInput) return;

    this.awsService.saveRoleArn(this.roleArnInput).subscribe({
      next: (res: any) => {
        alert('AWS Role Connected Successfully!');
        this.router.navigate(['/dashboard']); 
      },
      error: (err: any) => {
        this.errorMessage = err.error.error || 'Failed to save Role ARN.';
        this.cdr.detectChanges(); 
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}