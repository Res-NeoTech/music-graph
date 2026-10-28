#!/usr/bin/env python3
"""
Music Graph : génère tous les fichiers SVG du logo (concept « Liaisons »).

Idée : le « m » de music est formé de trois notes reliées par deux arcs. En musique, ces arcs sont
des liaisons ; en théorie des graphes, ce sont des arêtes entre trois nœuds (les artistes).

Construction : toute la géométrie du symbole découle de l'épaisseur du trait W (voir REGULIER).
Les têtes de note sont des ellipses inclinées à 25°, placées à gauche de leur hampe comme sur une
partition. Le logotype « music graph » est en Instrument Sans (SIL Open Font License 1.1), vectorisé :
les fichiers produits n'ont besoin d'aucune police installée.

Dépendances : pip install fonttools brotli uharfbuzz
Usage       : python logo/src/build_logo.py [--font chemin/vers/InstrumentSans-variable.ttf|.woff2]
              Sans --font, la police est cherchée dans le cache de next/font (.next/**/media/*.woff2) :
              lancer `npm run dev` une fois avant.
Sorties     : logo/svg/*.svg, logo/web/app/icon.svg, logo/web/components/music-graph-logo.tsx,
              logo/src/raster/*.svg (sources des PNG, du favicon.ico et de l'image de partage)
"""
import argparse
import glob
import io
import math
import os
import re

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

LOGO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJET = os.path.dirname(LOGO)

# Couleurs de la marque, reprises du thème (app/globals.css, voir README)
CRAMOISI = "#a50036"  # rose-800 : --primary en mode sombre
AUBERGINE = "#1d161e"  # --card en mode sombre
ROSE_CLAIR = "#fff1f2"  # rose-50 : --primary-foreground
GRIS_ROSE = "#a89ea9"  # --muted-foreground en mode sombre
NOIR, BLANC = "#000000", "#ffffff"

INCLINAISON = -25  # degrés : inclinaison des têtes de note
# W = épaisseur du trait, S = écart entre les hampes, L = longueur des hampes, rx/ry = tête de note
REGULIER = dict(W=20, S=72, L=82, rx=26, ry=19)
AFFINE = dict(W=19.2, S=72, L=82, rx=25.5, ry=18.6)  # clair sur foncé : -4 % (irradiation)
PETIT = dict(W=28, S=78, L=70, rx=31, ry=23)  # favicon 16-48 px : trait épaissi, m plus compact

# Logotype (unités de la police, 1000 par em)
INTERLETTRAGE = -12  # resserre légèrement l'approche, trop large à grande taille
ESPACE = 165  # espace entre « music » et « graph » (193 dans la police)
POINT_NOTE = 1.15  # le point du i devient une tête de note, aire 1,15 fois celle du point carré
GRAISSE, GRAISSE_SOMBRE = 600, 585  # texte clair sur fond sombre : un peu plus maigre (irradiation)
ASC, DESC, HX = 0.72, 0.215, 0.51  # hauteur des ascendantes, des descendantes, hauteur d'x (en em)


# ------------------------------------------------------------------ géométrie
def n(v):
    """nombre court pour les chemins SVG"""
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def point_droit(rx, ry, deg):
    """point le plus à droite d'une ellipse inclinée, relatif à son centre"""
    t = math.radians(deg)
    phi = math.atan2(-ry * math.sin(t), rx * math.cos(t))
    return (rx * math.cos(phi) * math.cos(t) - ry * math.sin(phi) * math.sin(t),
            rx * math.cos(phi) * math.sin(t) + ry * math.sin(phi) * math.cos(t))


def symbole(W, S, L, rx, ry):
    """Le m : 3 hampes, 2 arcs (demi-anneaux), 3 têtes de note.
    Origine : axe de la première hampe, à la base des arcs ; y vers le bas."""
    xs = (0, S, 2 * S)
    ra = S / 2
    formes = [("rect", x - W / 2, 0, x + W / 2, L) for x in xs]
    formes += [("arc", x + ra, 0, ra + W / 2, ra - W / 2) for x in xs[:2]]
    px, py = point_droit(rx, ry, INCLINAISON)
    # la tête touche le bord droit de sa hampe, en bas de celle-ci
    formes += [("ellipse", x + W / 2 - px, L - py, rx, ry, INCLINAISON) for x in xs]
    return formes


def boite(formes):
    xs, ys = [], []
    for f in formes:
        if f[0] in ("rect", "rrect"):
            _, x0, y0, x1, y1 = f[:5]
            xs += [x0, x1]
            ys += [y0, y1]
        elif f[0] == "arc":
            _, cx, cy, R, r = f
            xs += [cx - R, cx + R]
            ys += [cy - R, cy]
        elif f[0] == "ellipse":
            _, cx, cy, rx, ry, deg = f
            t = math.radians(deg)
            X = math.hypot(rx * math.cos(t), ry * math.sin(t))
            Y = math.hypot(rx * math.sin(t), ry * math.cos(t))
            xs += [cx - X, cx + X]
            ys += [cy - Y, cy + Y]
    return min(xs), min(ys), max(xs), max(ys)


def dedans(f, x, y):
    if f[0] == "rect":
        return f[1] <= x <= f[3] and f[2] <= y <= f[4]
    if f[0] == "arc":
        _, cx, cy, R, r = f
        return y <= cy and r * r <= (x - cx) ** 2 + (y - cy) ** 2 <= R * R
    _, cx, cy, rx, ry, deg = f
    t = math.radians(deg)
    u = (x - cx) * math.cos(t) + (y - cy) * math.sin(t)
    v = -(x - cx) * math.sin(t) + (y - cy) * math.cos(t)
    return (u / rx) ** 2 + (v / ry) ** 2 <= 1


def centre_de_masse(formes, pas=1.0):
    """centre de gravité de la surface du m (échantillonnage), pour le centrage optique"""
    x0, y0, x1, y1 = boite(formes)
    sx = sy = k = 0
    y = y0
    while y <= y1:
        x = x0
        while x <= x1:
            if any(dedans(f, x, y) for f in formes):
                sx += x
                sy += y
                k += 1
            x += pas
        y += pas
    return sx / k, sy / k


def chemin(formes, s=1.0, tx=0.0, ty=0.0):
    """chemin SVG (sous-chemins dans le même sens : leur union s'affiche sans couture)"""
    d = []
    for f in formes:
        if f[0] == "rect":
            _, x0, y0, x1, y1 = f
            X0, Y0, X1, Y1 = x0 * s + tx, y0 * s + ty, x1 * s + tx, y1 * s + ty
            d.append(f"M{n(X0)} {n(Y0)}H{n(X1)}V{n(Y1)}H{n(X0)}Z")
        elif f[0] == "rrect":
            _, x0, y0, x1, y1, r = f
            X0, Y0, X1, Y1, R = x0 * s + tx, y0 * s + ty, x1 * s + tx, y1 * s + ty, r * s
            d.append(f"M{n(X0 + R)} {n(Y0)}H{n(X1 - R)}A{n(R)} {n(R)} 0 0 1 {n(X1)} {n(Y0 + R)}"
                     f"V{n(Y1 - R)}A{n(R)} {n(R)} 0 0 1 {n(X1 - R)} {n(Y1)}H{n(X0 + R)}"
                     f"A{n(R)} {n(R)} 0 0 1 {n(X0)} {n(Y1 - R)}V{n(Y0 + R)}A{n(R)} {n(R)} 0 0 1 {n(X0 + R)} {n(Y0)}Z")
        elif f[0] == "arc":
            _, cx, cy, R, r = f
            cx, cy, R, r = cx * s + tx, cy * s + ty, R * s, r * s
            d.append(f"M{n(cx - R)} {n(cy)}A{n(R)} {n(R)} 0 0 1 {n(cx + R)} {n(cy)}H{n(cx + r)}"
                     f"A{n(r)} {n(r)} 0 0 0 {n(cx - r)} {n(cy)}Z")
        elif f[0] == "ellipse":
            _, cx, cy, rx, ry, deg = f
            cx, cy, rx, ry = cx * s + tx, cy * s + ty, rx * s, ry * s
            t = math.radians(deg)
            ax, ay = rx * math.cos(t), rx * math.sin(t)
            d.append(f"M{n(cx - ax)} {n(cy - ay)}A{n(rx)} {n(ry)} {n(deg)} 1 1 {n(cx + ax)} {n(cy + ay)}"
                     f"A{n(rx)} {n(ry)} {n(deg)} 1 1 {n(cx - ax)} {n(cy - ay)}Z")
    return "".join(d)


class Place:
    """formes placées : chemin SVG + boîte, après mise à l'échelle et translation"""

    def __init__(self, formes, s, tx, ty):
        self.d = chemin(formes, s, tx, ty)
        x0, y0, x1, y1 = boite(formes)
        self.box = (x0 * s + tx, y0 * s + ty, x1 * s + tx, y1 * s + ty)


def placer(formes, largeur=None, hauteur=None, x=None, y=None, cx=None, cy=None):
    x0, y0, x1, y1 = boite(formes)
    s = largeur / (x1 - x0) if largeur else hauteur / (y1 - y0)
    tx = x - x0 * s if x is not None else cx - (x0 + x1) / 2 * s
    ty = y - y0 * s if y is not None else cy - (y0 + y1) / 2 * s
    return Place(formes, s, tx, ty)


def m_dans_tuile(m, taille, part, x=0.0, y=0.0):
    """Le m dans une tuile carrée. Centrage optique : on centre le point à mi-chemin entre le centre
    de la boîte et le centre de masse du m (les têtes de note alourdissent le bas et la gauche),
    puis on remonte de 1,5 % (le centre optique est un peu au-dessus du centre géométrique)."""
    x0, y0, x1, y1 = boite(m)
    gx, gy = centre_de_masse(m)
    s = taille * part / (x1 - x0)
    vise_x = ((x0 + x1) / 2 + gx) / 2
    vise_y = ((y0 + y1) / 2 + gy) / 2
    return Place(m, s, x + taille / 2 - vise_x * s, y + taille / 2 - taille * 0.015 - vise_y * s)


def tuile(taille, x=0.0, y=0.0, arrondi=0.225):
    return Place([("rrect", x, y, x + taille, y + taille, taille * arrondi)], 1, 0, 0)


# ------------------------------------------------------------------ logotype
class Police:
    def __init__(self, chemin_vf, graisse):
        vf = TTFont(chemin_vf)
        vf.flavor = None
        inst = instancer.instantiateVariableFont(vf, {"wght": graisse})
        tampon = io.BytesIO()
        inst.save(tampon)
        donnees = tampon.getvalue()
        self.tt = TTFont(io.BytesIO(donnees))
        self.gs = self.tt.getGlyphSet()
        self.ordre = self.tt.getGlyphOrder()
        self.hb = hb.Font(hb.Face(hb.Blob(donnees)))

    def glyphe(self, nom, s, ox, oy):
        sp = SVGPathPen(self.gs)
        self.gs[nom].draw(TransformPen(sp, (s, 0, 0, -s, ox, oy)))
        bp = BoundsPen(self.gs)
        self.gs[nom].draw(bp)
        b = bp.bounds
        d = re.sub(r"-?\d+\.\d+", lambda mo: n(float(mo.group())), sp.getCommands())  # 2 décimales
        return d, (b and (ox + b[0] * s, oy - b[3] * s, ox + b[2] * s, oy - b[1] * s))


def logotype(police, texte, taille, x, base, note=True, interlettrage=INTERLETTRAGE, espace=ESPACE):
    """« music graph » vectorisé : crénage de la police (HarfBuzz), approche resserrée,
    point du i remplacé par une tête de note inclinée comme celles du symbole.
    note=False, interlettrage=0, espace=None : texte courant (ligne de description)."""
    tampon = hb.Buffer()
    tampon.add_str(texte)
    tampon.guess_segment_properties()
    hb.shape(police.hb, tampon, {"kern": True, "liga": True})
    s = taille / 1000
    plume = 0.0
    morceaux, boites = [], []
    for info, pos in zip(tampon.glyph_infos, tampon.glyph_positions):
        car = texte[info.cluster]
        ox, oy = x + (plume + pos.x_offset) * s, base - pos.y_offset * s
        if car == "i" and note:
            d, b = police.glyphe("dotlessi", s, ox, oy)
            # le point carré de la police occupe x 61..198, y 594..733 : même centre, aire x 1,15
            ry = math.sqrt(137 * 139 * POINT_NOTE / (math.pi * 1.37))
            point = ("ellipse", ox + 130.5 * s, oy - 663.5 * s, 1.37 * ry * s, ry * s, INCLINAISON)
            d += chemin([point])
            boites.append(boite([point]))
        else:
            d, b = police.glyphe(police.ordre[info.codepoint], s, ox, oy)
        morceaux.append(d)
        if b:
            boites.append(b)
        if car == " " and espace is not None:
            plume += espace
        else:
            plume += pos.x_advance + interlettrage
    bx = (min(b[0] for b in boites), min(b[1] for b in boites), max(b[2] for b in boites), max(b[3] for b in boites))
    return "".join(morceaux), bx


# ------------------------------------------------------------------ fichiers
def svg(calques, box, titre):
    # viewBox arrondi vers l'extérieur à des entiers (cadrage serré, moins d'une unité de marge)
    x0, y0, x1, y1 = math.floor(box[0]), math.floor(box[1]), math.ceil(box[2]), math.ceil(box[3])
    w, h = x1 - x0, y1 - y0
    corps = "".join(f'<path fill="{c}" d="{d}"/>' for d, c in calques)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{n(x0)} {n(y0)} {n(w)} {n(h)}" '
            f'width="{n(w)}" height="{n(h)}" role="img" aria-labelledby="title">'
            f'<title id="title">{titre}</title>{corps}</svg>\n')


def ecrire(chemin_relatif, contenu):
    p = os.path.join(LOGO, chemin_relatif)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(contenu)
    print("  ", chemin_relatif)


def union(*boites):
    return (min(b[0] for b in boites), min(b[1] for b in boites), max(b[2] for b in boites), max(b[3] for b in boites))


def trouver_police():
    for p in glob.glob(os.path.join(PROJET, ".next", "**", "media", "*.woff2"), recursive=True):
        try:
            tt = TTFont(p)
        except Exception:
            continue
        cmap = tt.getBestCmap() or {}
        if tt["name"].getDebugName(1) == "Instrument Sans" and "fvar" in tt and all(ord(c) in cmap for c in "musicgraph"):
            return p
    raise SystemExit("Instrument Sans introuvable : lancer `npm run dev` une fois, ou passer --font")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--font", help="Instrument Sans variable (.ttf ou .woff2)")
    chemin_police = ap.parse_args().font or trouver_police()
    print("police :", chemin_police)
    p_clair, p_sombre = Police(chemin_police, GRAISSE), Police(chemin_police, GRAISSE_SOMBRE)
    m_reg, m_aff, m_petit = symbole(**REGULIER), symbole(**AFFINE), symbole(**PETIT)
    T = "Music Graph"
    fs = 100  # taille du texte des logos : 100 unités = 1 em
    base = ASC * fs

    # -- logotype seul
    for p, c, nom in ((p_clair, AUBERGINE, "logotype"), (p_sombre, ROSE_CLAIR, "logotype-fond-sombre")):
        d, bx = logotype(p, "music graph", fs, 0, base)
        ecrire(f"svg/music-graph-{nom}.svg", svg([(d, c)], bx, T))

    # -- logo horizontal avec tuile : la tuile va des ascendantes aux descendantes,
    #    écart tuile-texte = 0,30 em
    cote = (ASC + DESC) * fs
    t = tuile(cote)
    m_t = m_dans_tuile(m_aff, cote, 0.64)
    for p, c, nom in ((p_clair, AUBERGINE, "logo"), (p_sombre, ROSE_CLAIR, "logo-fond-sombre")):
        d, bx = logotype(p, "music graph", fs, cote + 0.30 * fs, base)
        ecrire(f"svg/music-graph-{nom}.svg", svg([(t.d, CRAMOISI), (m_t.d, ROSE_CLAIR), (d, c)], union(t.box, bx), T))
    horizontal = dict(tuile=t, m=m_t, cote=cote)

    # -- logo horizontal sans tuile : symbole = 1,25 x la hauteur ascendantes-descendantes,
    #    centré sur la bande de la hauteur d'x
    centre_x = base - (ASC - DESC) / 2 * fs
    for m, p, cm, ct, nom in ((m_reg, p_clair, CRAMOISI, AUBERGINE, "logo-sans-tuile"),
                              (m_aff, p_sombre, ROSE_CLAIR, ROSE_CLAIR, "logo-sans-tuile-fond-sombre"),
                              (m_reg, p_clair, NOIR, NOIR, "logo-noir"),
                              (m_aff, p_sombre, BLANC, BLANC, "logo-blanc")):
        sym = placer(m, hauteur=1.25 * cote, x=0, cy=centre_x)
        d, bx = logotype(p, "music graph", fs, sym.box[2] + 0.30 * fs, base)
        ecrire(f"svg/music-graph-{nom}.svg", svg([(sym.d, cm), (d, ct)], union(sym.box, bx), T))

    # -- logo vertical : tuile = 2 x la hauteur ascendantes-descendantes, centrée au-dessus du texte
    cote_v = 2 * cote
    for p, c, nom in ((p_clair, AUBERGINE, "logo-vertical"), (p_sombre, ROSE_CLAIR, "logo-vertical-fond-sombre")):
        d, bx = logotype(p, "music graph", fs, 0, cote_v + 0.40 * fs + ASC * fs)
        x = (bx[0] + bx[2]) / 2 - cote_v / 2
        tv, mv = tuile(cote_v, x, 0), m_dans_tuile(m_aff, cote_v, 0.64, x, 0)
        ecrire(f"svg/music-graph-{nom}.svg", svg([(tv.d, CRAMOISI), (mv.d, ROSE_CLAIR), (d, c)], union(tv.box, bx), T))

    # -- symbole seul (cadrage serré, 256 de large)
    for m, c, nom in ((m_reg, CRAMOISI, "symbole"), (m_aff, ROSE_CLAIR, "symbole-fond-sombre"),
                      (m_reg, NOIR, "symbole-noir"), (m_aff, BLANC, "symbole-blanc"),
                      (m_petit, CRAMOISI, "symbole-petit")):
        sym = placer(m, largeur=256, x=0, y=0)
        ecrire(f"svg/music-graph-{nom}.svg", svg([(sym.d, c)], sym.box, T))

    # -- tuile (icône d'application)
    t256, m256 = tuile(256), m_dans_tuile(m_aff, 256, 0.64)
    ecrire("svg/music-graph-tuile.svg", svg([(t256.d, CRAMOISI), (m256.d, ROSE_CLAIR)], t256.box, T))
    ecrire("svg/music-graph-tuile-noir.svg", svg([(t256.d, NOIR), (m256.d, BLANC)], t256.box, T))

    # -- web : favicon vectoriel (coupe « petit », m plus grand dans la tuile pour 16-32 px)
    m_fav = m_dans_tuile(m_petit, 256, 0.78)
    ecrire("web/app/icon.svg", svg([(t256.d, CRAMOISI), (m_fav.d, ROSE_CLAIR)], t256.box, T))

    # -- sources des images matricielles (rendues en PNG / ICO, voir README)
    carre = Place([("rect", 0, 0, 256, 256)], 1, 0, 0)
    sources = {
        "favicon-16": [(t256.d, CRAMOISI), (m_dans_tuile(m_petit, 256, 0.80).d, ROSE_CLAIR)],
        "favicon-32": [(t256.d, CRAMOISI), (m_dans_tuile(m_petit, 256, 0.74).d, ROSE_CLAIR)],
        "apple-icon": [(carre.d, CRAMOISI), (m_dans_tuile(m_aff, 256, 0.62).d, ROSE_CLAIR)],
        "icon": [(t256.d, CRAMOISI), (m256.d, ROSE_CLAIR)],
        "icon-maskable": [(carre.d, CRAMOISI), (m_dans_tuile(m_aff, 256, 0.50).d, ROSE_CLAIR)],
    }
    for nom, calques in sources.items():
        ecrire(f"src/raster/{nom}.svg", svg(calques, (0, 0, 256, 256), T))

    # image de partage (Open Graph) 1200 x 630 : logo sur fond aubergine + une ligne de description
    W, H = 1200, 630
    k = 1.25  # échelle du logo : marges larges, certaines plateformes recadrent l'image en carré
    d_txt, bx = logotype(p_sombre, "music graph", fs * k, 0, 0)
    larg = cote * k + 0.30 * fs * k + bx[2]  # bx mesuré avec le texte posé en x = 0
    x0 = (W - larg) / 2
    y_base = H / 2 - 10
    t_og = tuile(cote * k, x0, y_base - ASC * fs * k)
    m_og = m_dans_tuile(m_aff, cote * k, 0.64, x0, y_base - ASC * fs * k)
    d_txt, _ = logotype(p_sombre, "music graph", fs * k, x0 + cote * k + 0.30 * fs * k, y_base)
    p_desc = Police(chemin_police, 400)
    desc = dict(note=False, interlettrage=0, espace=None)
    d_desc, bd = logotype(p_desc, "Explorer les liens entre artistes", 34, 0, 0, **desc)
    d_desc, bd = logotype(p_desc, "Explorer les liens entre artistes", 34, (W - (bd[2] - bd[0])) / 2 - bd[0],
                          y_base + 120, **desc)
    fond = Place([("rect", 0, 0, W, H)], 1, 0, 0)
    ecrire("src/raster/opengraph-image.svg",
           svg([(fond.d, AUBERGINE), (t_og.d, CRAMOISI), (m_og.d, ROSE_CLAIR), (d_txt, ROSE_CLAIR), (d_desc, GRIS_ROSE)],
               (0, 0, W, H), "Music Graph : explorer les liens entre artistes"))

    # -- composant React (logo horizontal + icône), chemins arrondis au dixième
    def court(d):
        return re.sub(r"-?\d+\.\d+", lambda mo: n(round(float(mo.group()), 1)), d)

    d_logo, bx = logotype(p_clair, "music graph", fs, cote + 0.30 * fs, base)
    vb = union(horizontal["tuile"].box, bx)
    vb = (math.floor(vb[0]), math.floor(vb[1]), math.ceil(vb[2]), math.ceil(vb[3]))
    tsx = TSX.format(
        vb=f"{vb[0]} {vb[1]} {vb[2] - vb[0]} {vb[3] - vb[1]}",
        tuile=court(horizontal["tuile"].d), m=court(horizontal["m"].d), texte=court(d_logo),
        tuile_icone=court(t256.d), m_icone=court(m256.d),
        cramoisi=CRAMOISI, rose=ROSE_CLAIR,
    )
    ecrire("web/components/music-graph-logo.tsx", tsx)


TSX = '''// Généré par logo/src/build_logo.py : ne pas modifier les chemins à la main.
// Couleurs fixes de la marque : tuile {cramoisi}, m {rose}.
// Le texte « music graph » est en currentColor : il prend la couleur du texte
// (par exemple text-foreground), donc il s'adapte aux thèmes clair et sombre.
import * as React from "react"

import {{ cn }} from "@/lib/utils"

const TILE =
  "{tuile}"
const SYMBOL =
  "{m}"
const WORDMARK =
  "{texte}"

const ICON_TILE =
  "{tuile_icone}"
const ICON_SYMBOL =
  "{m_icone}"

function MusicGraphLogo({{ className, ...props }}: React.ComponentProps<"svg">) {{
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="{vb}"
      role="img"
      aria-label="Music Graph"
      className={{cn("h-8 w-auto", className)}}
      {{...props}}
    >
      <path fill="{cramoisi}" d={{TILE}} />
      <path fill="{rose}" d={{SYMBOL}} />
      <path fill="currentColor" d={{WORDMARK}} />
    </svg>
  )
}}

function MusicGraphIcon({{ className, ...props }}: React.ComponentProps<"svg">) {{
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      role="img"
      aria-label="Music Graph"
      className={{cn("size-8", className)}}
      {{...props}}
    >
      <path fill="{cramoisi}" d={{ICON_TILE}} />
      <path fill="{rose}" d={{ICON_SYMBOL}} />
    </svg>
  )
}}

export {{ MusicGraphIcon, MusicGraphLogo }}
'''

if __name__ == "__main__":
    main()
