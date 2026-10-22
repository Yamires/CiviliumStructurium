"""Vérifie les noms et les secrets usuels dans tous les objets historiques publiables."""
import re
import subprocess
import sys
from pathlib import Path

repo = Path(sys.argv[1])

def git(*args):
    return subprocess.check_output(['git', '-C', str(repo), *args])

objects = git('rev-list', '--objects', '--all').decode().splitlines()
private = re.compile(r'(^|/)(\.env(?:\..*)?|\.DS_Store|\.venv|venv|node_modules)(/|$)|\.(xlsx|csv|pdf|pyc|pyo)$', re.I)
secrets = re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:postgres(?:ql)?://[^\s:/]+:[^\s@]+@)|(?:AKIA[0-9A-Z]{16})|(?:gh[pousr]_[A-Za-z0-9]{30,})')
problems = []
seen = set()
for line in objects:
    sha, _, name = line.partition(' ')
    if private.search(name):
        problems.append('Fichier privé ou généré : ' + name)
    if sha in seen or git('cat-file', '-t', sha).strip() not in (b'blob', b'commit', b'tag'):
        continue
    seen.add(sha)
    if secrets.search(git('cat-file', '-p', sha)):
        problems.append('Secret potentiel dans un objet de ' + (name or sha))
if problems:
    print('\n'.join(problems))
    sys.exit(1)
print(f'Historique vérifié : {len(seen)} objets uniques, aucun dataset ou secret usuel détecté.')
