import ast
import networkx as nx
from pathlib import Path


def extract_imports(source_code):
    imports = []
    try:
        tree = ast.parse(source_code)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module.split('.')[0])
    except SyntaxError:
        pass
    return imports


def build_dependency_graph(files):
    G = nx.DiGraph()
    for filename in files:
        G.add_node(filename)
    base_names = {Path(f).stem: f for f in files}
    for filename, source_code in files.items():
        imports = extract_imports(source_code)
        for imp in imports:
            if imp in base_names and base_names[imp] != filename:
                G.add_edge(filename, base_names[imp])
    return G


def group_files(G, files, max_chars=12000):
    groups = []
    visited = set()
    sorted_files = sorted(files.keys(), key=lambda f: G.degree(f), reverse=True)
    for filename in sorted_files:
        if filename in visited:
            continue
        group = [filename]
        visited.add(filename)
        group_chars = len(files[filename])
        neighbors = list(G.predecessors(filename)) + list(G.successors(filename))
        for neighbor in neighbors:
            if neighbor not in visited:
                if group_chars + len(files[neighbor]) <= max_chars:
                    group.append(neighbor)
                    visited.add(neighbor)
                    group_chars += len(files[neighbor])
        groups.append(group)
    return groups


def get_graph_summary(G):
    summary = []
    for node in G.nodes():
        deps = list(G.successors(node))
        if deps:
            summary.append(f"{node} → depends on → {', '.join(deps)}")
        else:
            summary.append(f"{node} → no local dependencies")
    return summary