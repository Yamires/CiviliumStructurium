import pandas as pd 
import yaml 
import re 

def filter_sections(values, dataframe_path = 'ressource/CISC_StructuralSectionTables_SST12.1.csv', config_path = 'ressource/config.yaml'):
    # Chargement de la configuration globale (phi, fy, etc.)
    with open(config_path, 'r') as file:
        config = yaml.safe_load(file)
    
    phi = float(config.get('phi', 0.9))
    fy = float(config.get('fy', 350))

    # Chargement du tableau des profilés
    df = pd.read_csv(dataframe_path, sep=';')
    df = df.replace({float('nan'): None})

    # Nettoyage et conversion des colonnes numériques
    for col in ['Sx', 'D', 'T', 'W', 'Ix', 'Zx']:
        df[col] = (
            df[col]
            .astype(str)
            .str.replace(' ', '', regex=False)
            .str.replace(',', '.', regex=False)
            .replace(['', '*'], 'None')
            .astype(float)
        )

    # Calcul du moment résistant Mr pour chaque profilé
    Mr_list = []
    for i, row in df.iterrows():
        if row['Prp'] == '*':  # Classe 3
            if pd.notnull(row['Sx']):
                Mr = phi * row['Sx'] * 1e3 * fy / 1e6
            else: 
                Mr = float('None')
        else:  # Classe 1 et 2
            if pd.notnull(row['Zx']):
                Mr = phi * row['Zx'] * 1e3 * fy / 1e6
            else:
                Mr = float('None')
        Mr_list.append(Mr)
    df['Mr'] = pd.Series(Mr_list, dtype='float64') 

    # Calcul de l'effort tranchant résistant Vr
    df['Vr'] = phi * 0.66 * fy * df['D'] * df['W'] / 1000

    # Fonction pour extraire la hauteur nominale et le poids linéique à partir de Ds_m
    def parse_ds_m(ds_m):
        expr = re.match(r'[A-Za-z]+(\d+)[xX](\d+)',str(ds_m))
        if expr:
            hauteur_nominale = int(expr.group(1))
            poids_lineique = int(expr.group(2))
            return hauteur_nominale, poids_lineique
        return None, None 
    
    # Affichage de debug (peut être retiré en production)
    print(df['Mr'].head(10))
    print(df['Vr'].head(10))
    print(df['Ix'].head(10))

    # Récupération des contraintes à respecter
    Mf = float(values.get('mf', 0))
    Vf = float(values.get('vf', 0))
    In = float(values.get('i', 0))

    # Filtrage selon les contraintes de moment, effort tranchant et inertie
    condition1 = df['Mr'] > Mf      # Mr doit être supérieur au moment fléchissant requis
    condition2 = df['Vr'] > Vf      # Vr doit être supérieur à l'effort tranchant requis
    condition3 = df['Ix'] < In      # Ix doit être inférieur à l'inertie maximale autorisée

    result = df[condition1 & condition2 & condition3]

    # Extraction des dimensions pour chaque profilé filtré
    dimension_liste = result['Ds_m'].apply(parse_ds_m)
    result['Hauteur_nominale'] = [t[0] for t in dimension_liste]
    result['Poid_lineique'] = [t[1] for t in dimension_liste]

    # Tri des résultats par hauteur nominale puis poids linéique
    result = result.sort_values(by=['Hauteur_nominale', 'Poid_lineique'])
    return result