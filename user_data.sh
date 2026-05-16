#!/bin/bash
# WanderLens — EC2 User Data Script
# Paste this into Launch Template → Advanced → User data
# Requires: IAM role with S3 read access attached to the Launch Template

dnf install -y nodejs npm

sudo npm install -g pm2

mkdir -p /home/ec2-user/wanderlens/public
cd /home/ec2-user/wanderlens

aws s3 cp s3://wanderlen-s3/wanderlens_server.js .
aws s3 cp s3://wanderlen-s3/.env .
aws s3 cp s3://wanderlen-s3/wanderlens-final.html public/index.html

npm init -y
npm install express mysql2 cors dotenv

sudo chown -R ec2-user:ec2-user /home/ec2-user/wanderlens

sudo -u ec2-user bash << 'EOF'
cd /home/ec2-user/wanderlens
pm2 start wanderlens_server.js
pm2 startup systemd -u ec2-user --hp /home/ec2-user | tail -1 | sudo bash
pm2 save
EOF
