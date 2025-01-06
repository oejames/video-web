exports.transcribeScript = (files) => `
import sys
import json
import os
import videogrep.transcribe as transcribe

# Function to safely read transcript file
def read_transcript_file(file_path):
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    except Exception as e:
        print(f"Error reading transcript file {file_path}: {str(e)}", file=sys.stderr)
        return None

# Capture all print statements for debugging
print("Python script started!", file=sys.stderr)
files = ${JSON.stringify(files)}
results = {}

for file in files:
    try:
        print(f"Processing file: {file}", file=sys.stderr)
        print("Starting transcription (this may take a while)...", file=sys.stderr)
        
        transcript_file = file.rsplit('.', 1)[0] + '.json'
        
        if not os.path.exists(transcript_file):
            print("Generating new transcript with Whisper...", file=sys.stderr)
            transcribe.transcribe(file)
            print("Whisper transcription complete", file=sys.stderr)
        else:
            print("Found existing transcript", file=sys.stderr)
        
        print("Reading transcript file...", file=sys.stderr)
        transcript_content = read_transcript_file(transcript_file)
        
        if transcript_content is not None:
            results[file] = transcript_content
            print(f"Successfully processed {file}", file=sys.stderr)
        else:
            results[file] = f"Error: Could not read transcript file {transcript_file}"
    except Exception as e:
        print(f"Error processing {file}: {str(e)}", file=sys.stderr)
        results[file] = str(e)

# Ensure clean JSON output
print(json.dumps(results))
sys.stdout.flush()
`;

exports.searchScript = (files, query, searchType) => `
import sys
import json
import videogrep

files = ${JSON.stringify(files)}
query = ${JSON.stringify(query)}
search_type = ${JSON.stringify(searchType)}

try:
    results = videogrep.search(files=files, query=query, search_type=search_type)
    print(json.dumps(results))
except Exception as e:
    print(json.dumps({'error': str(e)}))`;

exports.ngramsScript = (files, n) => `
import sys
import json
import videogrep
from collections import Counter

files = ${JSON.stringify(files)}
n = ${JSON.stringify(n)}

try:
    ngrams = videogrep.get_ngrams(files, n=n)
    most_common = Counter(ngrams).most_common(100)
    print(json.dumps(most_common))
except Exception as e:
    print(json.dumps({'error': str(e)}))`;

exports.exportScript = (files, query, searchType, outputPath, padding, resync) => `
import sys
import json
import videogrep

files = ${JSON.stringify(files)}
query = ${JSON.stringify(query)}
search_type = ${JSON.stringify(searchType || 'word')}
output = ${JSON.stringify(outputPath)}
padding = ${JSON.stringify(padding || 0)}
resync = ${JSON.stringify(resync || 0)}

try:
    print("Starting export process...", file=sys.stderr)
    videogrep.videogrep(files=files, query=query, search_type=search_type, output=output, padding=padding, resync=resync)
    print("Export process completed successfully!", file=sys.stderr)
except Exception as e:
    print(f"Error during export process: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;