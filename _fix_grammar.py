import json, re

path = 'v:/WtyczkaFTG/syntaxes/ftg.tmLanguage.json'
text = open(path, encoding='utf-8').read()

# Replace every occurrence where eventFields appears before techgroupAssignments in patterns blocks
old = '{\n              "include": "#eventFields"\n            },\n            {\n              "include": "#actions"\n            },\n            {\n              "include": "#techgroupAssignments"\n            },'
new = '{\n              "include": "#techgroupAssignments"\n            },\n            {\n              "include": "#eventFields"\n            },\n            {\n              "include": "#actions"\n            },'

count = text.count(old)
text = text.replace(old, new)
json.loads(text)
open(path, 'w', encoding='utf-8').write(text)
print(f'Fixed {count} occurrences')

