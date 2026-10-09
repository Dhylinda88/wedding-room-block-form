"""Generate compact manual figures with small icons (less empty space)."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parent
CREAM = (249, 247, 242)
NAVY = (10, 30, 60)
GOLD = (181, 142, 88)
WHITE = (255, 255, 255)
LINE = (212, 180, 131)
MUTED = (90, 101, 120)
ICON_BG = (243, 238, 228)


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


def title_banner(draw, w, text):
    draw.rectangle((0, 0, w, 48), fill=NAVY)
    f = font(20, True)
    tw = draw.textlength(text, font=f)
    draw.text(((w - tw) / 2, 12), text, fill=WHITE, font=f)


def arrow(draw, x0, y, x1):
    draw.line((x0, y, x1 - 7, y), fill=GOLD, width=3)
    draw.polygon([(x1, y), (x1 - 9, y - 5), (x1 - 9, y + 5)], fill=GOLD)


# --- icons (simple line art, navy/gold) ---

def icon_at(draw, cx, cy, kind, scale=1.0):
    s = 18 * scale
    # soft circle backdrop
    draw.ellipse((cx - s - 6, cy - s - 6, cx + s + 6, cy + s + 6), fill=ICON_BG, outline=LINE, width=1)

    if kind == "form":
        draw.rounded_rectangle((cx - s, cy - s * 1.1, cx + s, cy + s * 1.1), radius=4, outline=NAVY, width=2)
        for i in range(3):
            y = cy - s * 0.5 + i * s * 0.45
            draw.line((cx - s * 0.6, y, cx + s * 0.6, y), fill=GOLD, width=2)
    elif kind == "flow":
        # nodes + link
        draw.ellipse((cx - s, cy - 6, cx - s + 12, cy + 6), outline=NAVY, width=2)
        draw.ellipse((cx + s - 12, cy - 6, cx + s, cy + 6), outline=NAVY, width=2)
        draw.line((cx - s + 12, cy, cx + s - 12, cy), fill=GOLD, width=2)
    elif kind == "list":
        draw.rectangle((cx - s, cy - s, cx + s, cy + s), outline=NAVY, width=2)
        for i in range(3):
            y = cy - s * 0.55 + i * s * 0.5
            draw.line((cx - s * 0.7, y, cx + s * 0.7, y), fill=GOLD, width=2)
    elif kind == "email":
        draw.rectangle((cx - s, cy - s * 0.7, cx + s, cy + s * 0.7), outline=NAVY, width=2)
        draw.line((cx - s, cy - s * 0.7, cx, cy + 2), fill=GOLD, width=2)
        draw.line((cx + s, cy - s * 0.7, cx, cy + 2), fill=GOLD, width=2)
    elif kind == "link":
        draw.arc((cx - s, cy - s * 0.4, cx, cy + s * 0.4), 200, 520, fill=NAVY, width=2)
        draw.arc((cx, cy - s * 0.4, cx + s, cy + s * 0.4), 20, 340, fill=GOLD, width=2)
    elif kind == "lock":
        draw.rounded_rectangle((cx - s * 0.7, cy - 2, cx + s * 0.7, cy + s), radius=3, outline=NAVY, width=2)
        draw.arc((cx - s * 0.45, cy - s, cx + s * 0.45, cy + 4), 180, 360, fill=GOLD, width=2)
    elif kind == "edit":
        draw.polygon(
            [(cx - s * 0.3, cy + s * 0.6), (cx - s * 0.5, cy + s), (cx - s * 0.1, cy + s * 0.8)],
            fill=GOLD,
        )
        draw.line((cx - s * 0.2, cy + s * 0.5, cx + s * 0.6, cy - s * 0.6), fill=NAVY, width=3)
    elif kind == "save":
        draw.rounded_rectangle((cx - s, cy - s, cx + s, cy + s), radius=3, outline=NAVY, width=2)
        draw.rectangle((cx - s * 0.45, cy - s, cx + s * 0.45, cy - s * 0.2), fill=GOLD)
        draw.ellipse((cx - 4, cy + 2, cx + 4, cy + 10), outline=NAVY, width=2)
    elif kind == "send":
        draw.polygon(
            [(cx - s, cy), (cx + s, cy - s * 0.7), (cx + s * 0.2, cy), (cx + s, cy + s * 0.7)],
            outline=NAVY,
            fill=ICON_BG,
        )
        draw.line((cx - s, cy, cx + s * 0.2, cy), fill=GOLD, width=2)
    elif kind == "review":
        draw.ellipse((cx - s, cy - s, cx + s, cy + s), outline=NAVY, width=2)
        draw.ellipse((cx - s * 0.35, cy - s * 0.35, cx + s * 0.35, cy + s * 0.35), fill=GOLD)
    elif kind == "backup":
        # folder + check
        draw.polygon(
            [
                (cx - s, cy - s * 0.2),
                (cx - s * 0.3, cy - s * 0.2),
                (cx - s * 0.1, cy - s * 0.55),
                (cx + s, cy - s * 0.55),
                (cx + s, cy + s),
                (cx - s, cy + s),
            ],
            outline=NAVY,
            width=2,
        )
        draw.line((cx - 4, cy + 4, cx, cy + 10), fill=GOLD, width=2)
        draw.line((cx, cy + 10, cx + 8, cy - 2), fill=GOLD, width=2)
    elif kind == "type":
        draw.text((cx - 10, cy - 12), "Aa", fill=NAVY, font=font(16, True))
        draw.text((cx + 2, cy + 2), "12", fill=GOLD, font=font(11, True))
    elif kind == "js":
        draw.rounded_rectangle((cx - s, cy - s, cx + s, cy + s), radius=4, fill=GOLD)
        draw.text((cx - 7, cy - 10), "JS", fill=NAVY, font=font(14, True))
    elif kind == "column":
        draw.rectangle((cx - s * 0.9, cy - s, cx - s * 0.15, cy + s), outline=NAVY, width=2)
        draw.rectangle((cx + s * 0.15, cy - s, cx + s * 0.9, cy + s), outline=GOLD, width=2)
    elif kind == "map":
        draw.line((cx - s, cy + s * 0.3, cx - s * 0.2, cy - s * 0.5), fill=NAVY, width=2)
        draw.line((cx - s * 0.2, cy - s * 0.5, cx + s, cy + s * 0.2), fill=GOLD, width=2)
        for px, py in [(-s, 0.3), (-0.2, -0.5), (1, 0.2)]:
            draw.ellipse((cx + px * s - 3, cy + py * s - 3, cx + px * s + 3, cy + py * s + 3), fill=NAVY)
    elif kind == "null":
        draw.ellipse((cx - s, cy - s, cx + s, cy + s), outline=NAVY, width=2)
        draw.line((cx - s * 0.6, cy + s * 0.6, cx + s * 0.6, cy - s * 0.6), fill=GOLD, width=2)
    elif kind == "check":
        draw.ellipse((cx - s, cy - s, cx + s, cy + s), outline=NAVY, width=2)
        draw.line((cx - s * 0.4, cy, cx - s * 0.05, cy + s * 0.4), fill=GOLD, width=3)
        draw.line((cx - s * 0.05, cy + s * 0.4, cx + s * 0.5, cy - s * 0.35), fill=GOLD, width=3)
    elif kind == "html":
        draw.text((cx - 14, cy - 10), "</>", fill=NAVY, font=font(14, True))
    elif kind == "preview":
        draw.rounded_rectangle((cx - s * 1.1, cy - s * 0.75, cx + s * 1.1, cy + s * 0.75), radius=3, outline=NAVY, width=2)
        draw.rectangle((cx - s * 0.9, cy - s * 0.45, cx + s * 0.9, cy + s * 0.35), fill=ICON_BG, outline=GOLD, width=1)
    elif kind == "dryrun":
        draw.polygon([(cx, cy - s), (cx + s, cy + s * 0.7), (cx - s, cy + s * 0.7)], outline=NAVY, width=2)
        draw.line((cx, cy - 2, cx, cy + 6), fill=GOLD, width=2)
        draw.ellipse((cx - 2, cy + 10, cx + 2, cy + 14), fill=GOLD)
    elif kind == "fill":
        draw.rounded_rectangle((cx - s, cy - s * 0.5, cx + s, cy + s * 0.5), radius=3, outline=NAVY, width=2)
        draw.line((cx - s * 0.6, cy, cx + s * 0.3, cy), fill=GOLD, width=2)
        draw.polygon([(cx + s * 0.3, cy - 4), (cx + s * 0.3, cy + 4), (cx + s * 0.55, cy)], fill=GOLD)
    else:
        draw.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=GOLD)


def draw_card(draw, xy, title, subtitle, num, icon):
    """Compact card: [num][icon] title/subtitle — little empty space."""
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=10, fill=WHITE, outline=LINE, width=2)
    draw.rounded_rectangle((x0, y0, x1, y0 + 5), radius=2, fill=GOLD)

    mid = y0 + (y1 - y0) // 2

    # number badge
    label = str(num)
    r = 13 if len(label) < 3 else 15
    cx = x0 + 18
    draw.ellipse((cx - r, mid - r, cx + r, mid + r), fill=NAVY)
    nf = font(11 if len(label) > 2 else 13, True)
    nw = draw.textlength(label, font=nf)
    draw.text((cx - nw / 2, mid - 7), label, fill=WHITE, font=nf)

    # icon immediately after number
    icon_at(draw, x0 + 48, mid, icon, scale=0.72)

    # text fills remaining width
    tx = x0 + 72
    text_right = x1 - 10
    tf = font(14, True)
    sf = font(11)
    title_lines = wrap(draw, title, tf, text_right - tx)
    # vertically center text block
    sub_lines = wrap(draw, subtitle, sf, text_right - tx)
    block_h = 16 * len(title_lines) + 2 + 14 * len(sub_lines)
    ty = mid - block_h // 2
    for i, line in enumerate(title_lines):
        draw.text((tx, ty + i * 16), line, fill=NAVY, font=tf)
    sty = ty + 16 * len(title_lines) + 2
    for i, line in enumerate(sub_lines):
        draw.text((tx, sty + i * 14), line, fill=MUTED, font=sf)


def hflow(draw, y, steps, box_h=72, gap=16):
    """Horizontal flow of compact cards. steps: (num, title, subtitle, icon)."""
    n = len(steps)
    total_gap = gap * (n - 1) + 32 * (n - 1)  # gap + arrow space
    avail = 1400 - 80 - total_gap
    bw = avail // n
    x = 40
    mid_y = y + box_h // 2
    for i, (num, title, sub, icon) in enumerate(steps):
        draw_card(draw, (x, y, x + bw, y + box_h), title, sub, num, icon)
        if i < n - 1:
            arrow(draw, x + bw + 4, mid_y, x + bw + gap + 28)
        x += bw + gap + 32


def fig1():
    W, H = 1400, 155
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    title_banner(d, W, "Big picture")
    steps = [
        (1, "Form", "index.html / app.js / config.js", "form"),
        (2, "Power Automate", "Password, save, submit, PDF", "flow"),
        (3, "SharePoint list", "Wedding Room Planner", "list"),
        (4, "Email / OneDrive", "Resume link and staff PDF", "email"),
    ]
    hflow(d, 62, steps, box_h=72, gap=10)
    im.save(OUT / "manual-overview.jpg", quality=92)


def fig2():
    W, H = 1400, 150
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    title_banner(d, W, "Use the form — couples")
    steps = [
        (1, "Open link", "Form URL from hotel", "link"),
        (2, "Enter guest code", "Unlock", "lock"),
        (3, "Fill form", "Contact + details", "fill"),
        (4, "Save progress", "Resume email", "save"),
        (5, "Submit final", "Hotel gets PDF", "send"),
    ]
    hflow(d, 60, steps, box_h=70, gap=6)
    im.save(OUT / "manual-guest-flow.jpg", quality=92)


def fig3():
    W, H = 1400, 150
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    title_banner(d, W, "Use the form — staff")
    steps = [
        (1, "Staff unlock", "Staff code", "lock"),
        (2, "Start draft", "Name + wedding date", "edit"),
        (3, "Save (silent)", "No guest email", "save"),
        (4, "Send Form URL", "+ guest code", "send"),
        (5, "Review / edit", "List then Form URL", "review"),
    ]
    hflow(d, 60, steps, box_h=70, gap=6)
    im.save(OUT / "manual-staff-flow.jpg", quality=92)


def fig4a():
    W, H = 1400, 230
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    title_banner(d, W, "Add or change a field — steps 0 to 4.5")
    row1 = [
        (0, "Backup", "Git + flow Save As + list Excel", "backup"),
        (1, "Type + name", "text, number, date, choice", "type"),
        (2, "Edit app.js", "collectPayload — see code map", "js"),
    ]
    row2 = [
        (3, "List column", "Match type + display name", "column"),
        (4, "Map in PA", "Create + Update both paths", "map"),
        ("4.5", "Null-safe expr", "If date/number/choice blank", "null"),
    ]

    def row(y, items):
        n = len(items)
        gap, arrow_w = 12, 24
        avail = 1400 - 80 - (n - 1) * (gap + arrow_w)
        bw = avail // n
        x = 40
        bh = 68
        for i, step in enumerate(items):
            draw_card(d, (x, y, x + bw, y + bh), step[1], step[2], step[0], step[3])
            if i < n - 1:
                arrow(d, x + bw + 2, y + bh // 2, x + bw + gap + arrow_w - 2)
            x += bw + gap + arrow_w

    row(60, row1)
    row(145, row2)
    im.save(OUT / "manual-field-flow-a.jpg", quality=92)


def fig4b():
    W, H = 1400, 210
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    title_banner(d, W, "Add or change a field — steps 5 to 8")
    row = [
        (5, "Verify map", "Test or run history", "check"),
        (6, "Add HTML", "index.html field / section", "html"),
        (7, "Layout check", "Local preview", "preview"),
    ]
    n = len(row)
    gap, arrow_w = 12, 24
    avail = 1400 - 80 - (n - 1) * (gap + arrow_w)
    bw = avail // n
    x = 40
    y = 60
    bh = 68
    for i, step in enumerate(row):
        draw_card(d, (x, y, x + bw, y + bh), step[1], step[2], step[0], step[3])
        if i < n - 1:
            arrow(d, x + bw + 2, y + bh // 2, x + bw + gap + arrow_w - 2)
        x += bw + gap + arrow_w
    draw_card(
        d,
        (40, 145, 1360, 200),
        "Full dry-run, then commit / push",
        "Unlock, fill NEW field, Save, Submit, confirm list + PDF. Only then push to main.",
        8,
        "dryrun",
    )
    im.save(OUT / "manual-field-flow-b.jpg", quality=92)


if __name__ == "__main__":
    fig1()
    fig2()
    fig3()
    fig4a()
    fig4b()
    print("ok", sorted(p.name for p in OUT.glob("manual-*.jpg")))
