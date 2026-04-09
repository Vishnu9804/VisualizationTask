import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AwsSetupComponent } from './aws-setup.component';

describe('AwsSetupComponent', () => {
  let component: AwsSetupComponent;
  let fixture: ComponentFixture<AwsSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AwsSetupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AwsSetupComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
