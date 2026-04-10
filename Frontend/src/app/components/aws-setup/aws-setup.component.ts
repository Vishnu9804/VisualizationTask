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

  constructor(
    private awsService: AwsService, 
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.awsService.getAwsSetupInfo().subscribe({
      next: (res: any) => {
        // We only care about the user ID now for the trust policy
        this.auth0UserId = res.auth0UserId;
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
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
}