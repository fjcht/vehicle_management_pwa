import os
import re

# Files to fix
files_to_fix = [
    'app/api/vehicles/[id]/route.ts',
    'app/api/repairs/[id]/route.ts', 
    'app/api/employees/[id]/route.ts',
    'app/api/nhtsa/[vin]/route.ts',
    'app/api/vehicles/vin/[vin]/route.ts'
]

for file_path in files_to_fix:
    if os.path.exists(file_path):
        print(f"Fixing {file_path}...")
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Add await params line after function signature if not already present
        if 'const { id } = await params' not in content and '[id]' in file_path:
            content = re.sub(
                r'(\) \{\n)(  try \{)',
                r'\1  const { id } = await params\n\2',
                content
            )
        
        if 'const { vin } = await params' not in content and '[vin]' in file_path:
            content = re.sub(
                r'(\) \{\n)(  try \{)',
                r'\1  const { vin } = await params\n\2',
                content
            )
        
        # Replace params.id with id
        content = re.sub(r'params\.id', 'id', content)
        
        # Replace params.vin with vin  
        content = re.sub(r'params\.vin', 'vin', content)
        
        with open(file_path, 'w') as f:
            f.write(content)
        
        print(f"Fixed {file_path}")

print("All API routes fixed!")
