from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parent
CREAM = (249, 247, 242)
NAVY = (10, 30, 60)
GOLD = (181, 142, 88)
WHITE = (255, 255, 255)
LINE = (212, 180, 131)
MUTED = (90, 101, 120)


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()


def wrap(draw, text, f, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=f) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def draw_box(draw, xy, title, subtitle, num=None):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=14, fill=WHITE, outline=LINE, width=2)
    draw.rounded_rectangle((x0, y0, x1, y0 + 8), radius=4, fill=GOLD)
    tx, ty = x0 + 14, y0 + 22
    if num is not None:
        label = str(num)
        r = 18 if len(label) < 3 else 22
        cx, cy = x0 + 28, y0 + 36
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=NAVY)
        nf = font(14 if len(label) > 2 else 16, True)
        nw = draw.textlength(label, font=nf)
        draw.text((cx - nw / 2, cy - 9), label, fill=WHITE, font=nf)
        tx = x0 + 52
    tf = font(18, True)
    sf = font(14)
    title_lines = wrap(draw, title, tf, x1 - tx - 12)
    for i, line in enumerate(title_lines):
        draw.text((tx, ty + i * 22), line, fill=NAVY, font=tf)
    sty = ty + 22 * len(title_lines) + 6
    for i, line in enumerate(wrap(draw, subtitle, sf, x1 - tx - 12)):
        draw.text((tx, sty + i * 18), line, fill=MUTED, font=sf)


def arrow(draw, x0, y, x1):
    draw.line((x0, y, x1 - 8, y), fill=GOLD, width=3)
    draw.polygon([(x1, y), (x1 - 10, y - 6), (x1 - 10, y + 6)], fill=GOLD)


def title_banner(draw, w, text):
    draw.rectangle((0, 0, w, 56), fill=NAVY)
    f = font(22, True)
    tw = draw.textlength(text, font=f)
    draw.text(((w - tw) / 2, 14), text, fill=WHITE, font=f)


def fig1():
    W, H = 1400, 420
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    title_banner(d, W, "How the system fits together")
    boxes = [
        (40, 100, 340, 340, "Form (GitHub Pages)", "index.html / app.js / config.js"),
        (380, 100, 680, 340, "Power Automate", "Password, save, submit, PDF"),
        (720, 100, 1020, 340, "SharePoint list", "Wedding Room Planner"),
        (1060, 100, 1360, 340, "Email / OneDrive", "Resume link and staff PDF"),
    ]
    for x0, y0, x1, y1, t, s in boxes:
        draw_box(d, (x0, y0, x1, y1), t, s)
    for x in (340, 680, 1020):
        arrow(d, x + 8, 220, x + 32)
    im.save(OUT / "manual-overview.jpg", quality=92)


def fig2():
    W, H = 1400, 400
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    title_banner(d, W, "Couples: use the form")
    steps = [
        (1, "Open link", "Form URL from hotel"),
        (2, "Enter guest code", "Unlock"),
        (3, "Fill form", "Contact + details"),
        (4, "Save progress", "Resume email"),
        (5, "Submit final", "Hotel gets PDF"),
    ]
    gap, bw = 20, 240
    x = 40
    for n, t, s in steps:
        draw_box(d, (x, 100, x + bw, 340), t, s, num=n)
        if n < 5:
            arrow(d, x + bw + 2, 220, x + bw + gap - 2)
        x += bw + gap
    im.save(OUT / "manual-guest-flow.jpg", quality=92)


def fig3():
    W, H = 1400, 400
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    title_banner(d, W, "Staff: typical workflow")
    steps = [
        (1, "Staff unlock", "Staff code"),
        (2, "Start draft", "Name + wedding date"),
        (3, "Save (silent)", "No guest email"),
        (4, "Send Form URL", "+ guest code"),
        (5, "Review / edit", "List then Form URL"),
    ]
    gap, bw = 20, 240
    x = 40
    for n, t, s in steps:
        draw_box(d, (x, 100, x + bw, 340), t, s, num=n)
        if n < 5:
            arrow(d, x + bw + 2, 220, x + bw + gap - 2)
        x += bw + gap
    im.save(OUT / "manual-staff-flow.jpg", quality=92)


def fig4():
    W, H = 1400, 820
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    title_banner(d, W, "Add or change a field (full chain)")
    rows = [
        [
            (0, "BACKUP", "Branch or zip + flow Save As"),
            (1, "Type + name", "text, number, date, choice"),
            (2, "Edit app.js", "collectPayload JSON key"),
        ],
        [
            (3, "List column", "Match type + display name"),
            (4, "Map in PA", "Create + Update both paths"),
            ("4.5", "Null-safe expr", "If date/number/choice blank"),
        ],
        [
            (5, "Verify map", "Test or run history"),
            (6, "Add HTML", "Field / section layout"),
            (7, "Layout check", "Local preview"),
        ],
    ]
    y = 80
    bw, gap = 420, 30
    for row in rows:
        x = 40
        for n, t, s in row:
            draw_box(d, (x, y, x + bw, y + 180), t, s, num=n)
            x += bw + gap
        y += 200
    draw_box(
        d,
        (40, y, 1360, y + 150),
        "Full dry-run, then commit / push",
        "Unlock, fill NEW field, Save, Submit, confirm list + PDF. Only then push to main.",
        num=8,
    )
    im.save(OUT / "manual-list-pa-flow.jpg", quality=92)


if __name__ == "__main__":
    fig1()
    fig2()
    fig3()
    fig4()
    print("ok", sorted(p.name for p in OUT.glob("manual-*.jpg")))
