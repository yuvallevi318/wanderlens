WanderLens — Asia Travel Photo Atlas
An AI-powered travel photo atlas for Asia. Upload a photo and Claude automatically identifies the location, district, and generates a fun fact. Built on AWS with a full serverless AI pipeline.claude is activated using AWS bedrock.

Tech stack:

CDN / HTTPS - CloudFront

Static hosting - S3

Backend - EC2 (Node.js + PM2) behind an ALB

Auto scaling - Auto Scaling Group across 2 AZs

Database - RDS MySQL 

AI proxyAPI - Gateway → Lambda → Bedrock (Claude Sonnet 4.6)





Redeployment guide:

 Prerequisites-
1.AWS account with Bedrock Claude Sonnet 4.6 enabled


2.RDS MySQL instance running (wanderlens database)


3.S3 bucket (wanderlen-s3) with public static website hosting enabled


4.EC2 IAM role with S3 read access attached to your Launch Template
