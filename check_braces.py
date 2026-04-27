import re

lines = open(r'd:\Steam\steamapps\common\For The Glory\Mods\Gloriana_1337\Work Folder\ftg-refs-codelens\extension.js', encoding='utf-8').readlines()
depth = 0
for i, line in enumerate(lines):
    cl = line
    # strip line comments
    ci = cl.find('//')
    if ci >= 0:
        cl = cl[:ci]
    # remove string literals crudely
    cl = re.sub(r'"[^"]*"', '', cl)
    cl = re.sub(r"'[^']*'", '', cl)
    cl = re.sub(r'`[^`]*`', '', cl)
    for ch in cl:
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
    if depth < 0:
        print(f'NEGATIVE L{i+1}: {line.rstrip()[:100]}')
        depth = 0
print('Done, final depth:', depth)
