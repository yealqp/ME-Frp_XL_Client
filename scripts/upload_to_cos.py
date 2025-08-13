#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import argparse
from qcloud_cos import CosConfig
from qcloud_cos import CosS3Client
from qcloud_cos.cos_exception import CosClientError, CosServiceError

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer)

def delete_files_with_prefix(client, bucket, prefix, file_prefix):
    """
    Delete files with specific prefix in COS bucket
    
    Args:
        client: COS client instance
        bucket: COS bucket name
        prefix: Directory prefix (e.g., 'latest/')
        file_prefix: File name prefix to delete (e.g., 'me')
    """
    try:
        # List objects with prefix
        response = client.list_objects(
            Bucket=bucket,
            Prefix=prefix
        )
        
        if 'Contents' in response:
            files_to_delete = []
            for obj in response['Contents']:
                file_name = os.path.basename(obj['Key'])
                if file_name.startswith(file_prefix):
                    files_to_delete.append({'Key': obj['Key']})
            
            if files_to_delete:
                print(f"Deleting {len(files_to_delete)} files with prefix '{file_prefix}' from {prefix}")
                delete_response = client.delete_objects(
                    Bucket=bucket,
                    Delete={
                        'Objects': files_to_delete,
                        'Quiet': True
                    }
                )
                print(f"Successfully deleted {len(files_to_delete)} files")
            else:
                print(f"No files found with prefix '{file_prefix}' in {prefix}")
        else:
            print(f"No files found in {prefix}")
            
    except Exception as e:
        print(f"Error deleting files: {e}")
        
def upload_file_to_cos(file_path, cos_key, bucket, region, secret_id, secret_key, also_upload_to_latest=False):
    """
    Upload file to Tencent Cloud COS
    
    Args:
        file_path: Local file path
        cos_key: COS object key
        bucket: COS bucket name
        region: COS region
        secret_id: Tencent Cloud SecretId
        secret_key: Tencent Cloud SecretKey
        also_upload_to_latest: Whether to also upload to latest folder
    """
    # Validate required parameters
    if not all([bucket, region, secret_id, secret_key]):
        print("Error: Missing required COS configuration parameters")
        print(f"Bucket: {'✓' if bucket else '✗'}")
        print(f"Region: {'✓' if region else '✗'}")
        print(f"SecretId: {'✓' if secret_id else '✗'}")
        print(f"SecretKey: {'✓' if secret_key else '✗'}")
        return False
        
    try:
        # 配置COS客户端
        config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key)
        client = CosS3Client(config)
        
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: File {file_path} does not exist")
            return False
            
        # Get file size
        file_size = os.path.getsize(file_path)
        print(f"Starting upload: {file_path} ({file_size} bytes)")
        print(f"Target location: {bucket}/{cos_key}")
        
        # Upload file
        response = client.upload_file(
            Bucket=bucket,
            LocalFilePath=file_path,
            Key=cos_key,
            PartSize=1,
            MAXThread=10,
            EnableMD5=False
        )
        
        print(f"Upload successful! ETag: {response['ETag']}")
        
        # Generate access URL
        url = f"https://{bucket}.cos.{region}.myqcloud.com/{cos_key}"
        print(f"Access URL: {url}")
        
        # Also upload to latest folder if requested
        if also_upload_to_latest:
            # Use fixed filename for latest folder (remove version number)
            original_name = os.path.basename(file_path)
            if '.msi' in original_name:
                latest_filename = "XL-ME-Frp-Launcher-amd64-latest.msi"
            elif '.exe' in original_name:
                latest_filename = "XL-ME-Frp-Launcher-amd64-latest.exe"
            else:
                latest_filename = original_name  # fallback to original name
            
            latest_key = f"windows/latest/{latest_filename}"
            
            # Delete existing files with 'me' prefix in latest folder
            delete_files_with_prefix(client, bucket, "latest/", "me")
            
            print(f"Uploading to latest folder: {latest_key}")
            latest_response = client.upload_file(
                Bucket=bucket,
                LocalFilePath=file_path,
                Key=latest_key,
                PartSize=1,
                MAXThread=10,
                EnableMD5=False
            )
            
            print(f"Latest upload successful! ETag: {latest_response['ETag']}")
            latest_url = f"https://{bucket}.cos.{region}.myqcloud.com/{latest_key}"
            print(f"Latest access URL: {latest_url}")
        
        return True
        
    except CosClientError as e:
        print(f"Client error: {e}")
        return False
    except CosServiceError as e:
        print(f"Service error: {e.get_error_code()}, {e.get_error_msg()}")
        return False
    except Exception as e:
        print(f"Unknown error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Upload file to Tencent Cloud COS')
    parser.add_argument('file_path', help='File path to upload')
    parser.add_argument('cos_key', help='COS object key')
    parser.add_argument('--bucket', required=True, help='COS bucket name')
    parser.add_argument('--region', required=True, help='COS region')
    parser.add_argument('--secret-id', required=True, help='Tencent Cloud SecretId')
    parser.add_argument('--secret-key', required=True, help='Tencent Cloud SecretKey')
    parser.add_argument('--also-latest', action='store_true', help='Also upload to latest folder')
    
    args = parser.parse_args()
    
    success = upload_file_to_cos(
        file_path=args.file_path,
        cos_key=args.cos_key,
        bucket=args.bucket,
        region=args.region,
        secret_id=args.secret_id,
        secret_key=args.secret_key,
        also_upload_to_latest=args.also_latest
    )
    
    if success:
        print("File upload completed!")
        sys.exit(0)
    else:
        print("File upload failed!")
        sys.exit(1)

if __name__ == '__main__':
    main()
