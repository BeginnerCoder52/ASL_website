import os, hashlib, collections, sys

dirs = [
    os.path.join(os.path.dirname(__file__), "data", "DATASET"),
    os.path.join(os.path.dirname(__file__), "data", "asl_dataset"),
]

counts = collections.Counter()
hash_map = {}
dups = []

for d in dirs:
    if not os.path.isdir(d):
        continue
    for cls in os.listdir(d):
        cls_path = os.path.join(d, cls)
        if not os.path.isdir(cls_path):
            continue
        files = [f for f in os.listdir(cls_path) if os.path.isfile(os.path.join(cls_path, f))]
        counts[cls] += len(files)
        for f in files:
            fp = os.path.join(cls_path, f)
            try:
                h = hashlib.md5(open(fp, "rb").read()).hexdigest()
            except Exception as e:
                print("skip", fp, e)
                continue
            if h in hash_map:
                dups.append((fp, hash_map[h]))
            else:
                hash_map[h] = fp

print("Class counts (sample):")
for k, v in counts.most_common()[:20]:
    print(f"  {k}: {v}")
print(f"Total files scanned: {sum(counts.values())}")
print(f"Duplicate files found: {len(dups)}")
if dups:
    print("First duplicates:")
    for a, b in dups[:10]:
        print(" ", a, "<->", b)