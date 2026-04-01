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

parent_to_children = defaultdict(list)
for doc_id, _ in top_docs:
    parent_id = doc_map[doc_id]["metadata"]["parent_id"]
    parent_to_children[parent_id].append({...})

parent_ids = list(parent_to_children.keys())
parent_docs = self.store.mget(parent_ids)

results.append({
    "id": parent_id,
    "content": parent_text,          
    "metadata": parent_metadata,    
    "children": child_ids    
})