#!/usr/bin/env python
"""Run the ETL pipeline"""
import sys
import subprocess

# First, try to install requirements
print("📦 Installing dependencies...")
try:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "-r", "requirements.txt"])
    print("✅ Dependencies installed!")
except Exception as e:
    print(f"⚠️  Failed to install some packages: {e}")

# Run the pipeline
print("\n🚀 Running ETL Pipeline...\n")
import etl_pipeline.daily_replay as pipeline
pipeline.main()
print("\n✅ Pipeline completed!")
