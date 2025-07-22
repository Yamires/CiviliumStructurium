import pandas as pd 
import yaml 
import re 

def filter_sections(values, dataframe_path = 'ressource/CISC_StructuralSectionTables_SST12.1.csv', config_path = 'ressource/config.yaml'):

    with open(config_path, 'r') as file:
        config = yaml.safe_load(file)
    
    phi = float(config.get('phi', 0.9))
    fy = float(config.get('fy', 350))
    df = pd.read_csv(dataframe_path, sep=';')
    # df = df.fillna(); 
    df = df.replace({float('nan'): None})

    #print(df.columns.tolist())


    for col in ['Sx', 'D', 'T', 'W', 'Ix', 'Zx']:
        df[col] = (
            df[col]
            .astype(str)
            .str.replace(' ', '', regex=False)
            .str.replace(',', '.', regex=False)
            .replace(['', '*'], 'None')
            .astype(float)
        )
        #print(f"{col} : {df[col].isna().sum()} valeurs NaN")

    # Ajout MR et VR 
    # Mr = phi * Zx * Fy / 1e6 ## for class 1 and 2 
    ## class 3 ['Mr'] = phi * df['Sx'] * 1e3 * fy / 1e6

    Mr_list = []

    for i, row in df.iterrows():
        if row['Prp'] == '*':
            if pd.notnull(row['Sx']):
                Mr = phi * row['Sx'] * 1e3 * fy / 1e6
            else: 
                Mr = float('None')
        else: 
            if pd.notnull(row['Zx']):
                Mr = phi * row['Zx'] * 1e3 * fy / 1e6
            else:
                Mr = float('None')
        Mr_list.append(Mr)
    
    df['Mr'] = pd.Series(Mr_list, dtype='float64') 

    df['Vr'] = phi * 0.66 * fy * df['D'] * df['W'] / 1000

   
    # on extraire le hauteur nominale et le poids linéique de ds_m avec un regex
    def parse_ds_m(ds_m):
        expr = re.match(r'[A-Za-z]+(\d+)[xX](\d+)',str(ds_m))
        if expr:
            hauteur_nominale = int(expr.group(1))
            poids_lineique = int(expr.group(2))
            return hauteur_nominale, poids_lineique
        return None, None 
    

    Mf = float(values.get('mf', 0))
    Vf = float(values.get('vf', 0))
    In = float(values.get('i', 0))

   
    """  
    Mx < Mf < Mr
    Mx = moment sollicitant (ce que subit la poutre)
    Mf = moment admissible en service (limite d'utilisation normale)
    Mr = moment résistant ultime (limite de rupture) 
    """
    condition1 = df['Mr'] > Mf
    """ 
    Vx < Vf < Vr
    Vx = effort tranchant sollicitant (ce que subit la poutre)
    Vf = effort tranchant admissible en service (limite d'utilisation normale)
    Vr = effort tranchant résistant ultime (limite de rupture au cisaillement) 
    """
    condition2 = df['Vr'] > Vf
    """ 
    Ix < I
    Ix = moment d'inertie requis (calculé selon les critères de déformation)
    I = moment d'inertie de la section choisie (caractéristique géométrique) 
    """
    condition3 = df['Ix'] < In 

    result = df[condition1 & condition2 & condition3]

    dimension_liste = result['Ds_m'].apply(parse_ds_m)
    result['Hauteur_nominale'] = [t[0] for t in dimension_liste]
    result['Poid_lineique'] = [t[1] for t in dimension_liste]

    result = result.sort_values(by=['Hauteur_nominale', 'Poid_lineique'])
    return result
