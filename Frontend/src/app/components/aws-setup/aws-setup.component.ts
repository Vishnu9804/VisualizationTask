import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- 1. IMPORTED HERE
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
    this.awsService.getSetupInfo().subscribe({
      next: (res) => {
        console.log("SUCCESS DATA FROM BACKEND:", res);
        this.appAccountId = res.appAccountId;
        this.externalId = res.externalId;
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
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
      next: (res) => {
        alert('AWS Role Connected Successfully!');
        this.router.navigate(['/dashboard']); 
      },
      error: (err) => {
        this.errorMessage = err.error.error || 'Failed to save Role ARN.';
        this.cdr.detectChanges(); 
      }
    });
  }
}