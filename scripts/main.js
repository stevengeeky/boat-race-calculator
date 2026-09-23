//
var WATER_COLOR = "rgba(150, 150, 255, .4)", WATER_TOP = "rgba(50, 50, 255, .4)",
    BOAT_COLOR = "sandybrown", BOAT_BORDER = "brown",
    OK_COLOR = "rgba(50, 200, 50, .55)", CLOSE_COLOR = "rgba(255, 180, 0, .6)", SUNK_COLOR = "rgba(255, 50, 50, .6)",
    SCALE = 35;

//
var mc, ctx;
var boatDimensions = [6, 4, 2],     // L x W x H, ft
    G = 200, S = 120, B = 10, LW = 200;    // Lbs

var ftInMeter = 3.28084,
    kgInLbs = 0.453592;

// Physics
var RHO = 62.4,         // lb/ft^3, fresh water
    SEAT_CG = 1,        // ft above the floor, a person sitting down
    SEAT_LEN = 2,       // ft of length a sitting person takes up
    CARGO_CG = .25,     // ft above the floor, the leeway weight
    CLOSE_FREEBOARD = .25,  // amber below this fraction of the hull height
    CLOSE_GM = .25;         // ft, amber below this metacentric height

var first = true, dim, units = "ft";
var cheight = .0258, cheightft = cheight * ftInMeter;

var calc;       // the numbers, see calculate()
var shown = { draft:0, x1:0, x2:0, v:[0, 0, 0] };    // what is drawn right now, eased toward calc

window.onload = function()
{
    mc = document.createElement("canvas");
    
    mc.style.background = "linear-gradient(to bottom right, white, lightblue)";
    mc.style.borderRadius = "5px";
    mc.style.border = "1px solid gray";
    mc.style["box-shadow"] = "5px 5px 5px rgba(100, 100, 100, .4)";
    mc.width = Math.min(640, window.innerWidth - 10);
    var panel = document.getElementById("showinfo").parentNode;
    if (window.innerWidth - panel.offsetWidth - 30 >= 480)   // room beside the panel
        mc.width = Math.min(640, window.innerWidth - panel.offsetWidth - 30);
    mc.height = 480;
    mc.style.maxWidth = window.innerWidth + "px";
    
    ctx = mc.getContext("2d");
    document.body.appendChild(mc);
    
    document.getElementById("showinfo").onclick = function(){
        alert("This tool gives a rough idea of how a cardboard boat will sit in the water according to a few changeable variables.  The dimensions are length by width by height.  Leeway weight is extra load added on top of the passengers and the boat, to see how much you can add before it sinks.\n\nA floating boat pushes aside its own weight in water (" + RHO + " lb per cubic foot), so a box hull sinks until length x width x depth of water weighs the same as everything in it.  What is left above the water is the freeboard: green is comfortable, amber is within " + Math.round(CLOSE_FREEBOARD * 100) + "% of the top edge, red is under.  The end view marks the centre of gravity (G) and the metacentre (M); the boat rights itself when M is above G.  The top view puts the two passengers where their weights balance about the middle, so the boat sits level.\n\nThe white \"ghost\" shows where the boat would be without any sinking distance.  The brown base is the bottom layer of cardboard (with an assumed cardboard thickness of " + round(cheight) + " m (" + round(cheightft) + " ft)).\nMade By Steven O'Riley");
    };
    
    dim = document.getElementById("dimensions");
    
    var ids = ["dimensions", "gw", "sw", "bw", "ew"];
    for (var i = 0; i < ids.length; i++)
        document.getElementById(ids[i]).oninput = changed;
    document.getElementById("units").onchange = switchUnits;
    
    changed();
    _loop();
}

function _loop()
{
    requestAnimationFrame(_loop);
    mc.width = mc.width;
    
    settle();
    
    drawSide();
    drawEnd();
    drawTop();
    
    first = false;
}

function changed()
{
    getStuff();
    calc = calculate();
    drawWhy();
}

function getStuff()
{
    var dv = dim.value.replace(/ |\n|\t/g, "");
    var sp = dv.split("x");
    var toFt = units == "m" ? ftInMeter : 1, toLb = units == "m" ? 1 / kgInLbs : 1;
    
    boatDimensions[0] = (+sp[0] || 1) * toFt;
    boatDimensions[1] = (+sp[1] || 1) * toFt;
    boatDimensions[2] = (+sp[2] || 1) * toFt;
    
    G = (+document.getElementById("gw").value || 0) * toLb;
    S = (+document.getElementById("sw").value || 0) * toLb;
    B = (+document.getElementById("bw").value || 0) * toLb;
    LW = (+document.getElementById("ew").value || 0) * toLb;
}

// Rewrite the inputs in the other unit system from the values already read,
// so switching back and forth never drifts; the boat itself does not change
function switchUnits()
{
    var to = document.getElementById("units").value;
    if (to == units)
        return;
    
    var len = to == "m" ? 1 / ftInMeter : 1, wt = to == "m" ? kgInLbs : 1;
    
    dim.value = round(boatDimensions[0] * len) + "x" + round(boatDimensions[1] * len) + "x" + round(boatDimensions[2] * len);
    
    var ids = ["gw", "sw", "bw", "ew"], vals = [G, S, B, LW];
    for (var i = 0; i < ids.length; i++)
        document.getElementById(ids[i]).value = round(vals[i] * wt);
    
    var spans = document.getElementsByClassName("ulen");
    for (var i = 0; i < spans.length; i++)
        spans[i].textContent = to == "m" ? "(m)" : "(ft)";
    spans = document.getElementsByClassName("uwt");
    for (var i = 0; i < spans.length; i++)
        spans[i].textContent = to == "m" ? "(kg)" : "(lbs)";
    
    units = to;
    drawWhy();
}

// Everything in ft and lb
function calculate()
{
    var L = boatDimensions[0], W = boatDimensions[1], H = boatDimensions[2];
    var c = {};
    
    // Archimedes: the boat sinks until the water it pushes aside weighs what it carries
    //   W_total = RHO * L * W * draft
    c.load = G + S + B;                 // lb, without the leeway
    c.total = c.load + LW;              // lb
    c.area = L * W;                     // ft^2, the waterplane of a box hull
    c.draft = c.total / (RHO * c.area); // ft
    c.draft0 = c.load / (RHO * c.area); // ft, without the leeway
    c.freeboard = H - c.draft;          // ft
    c.floats = c.freeboard > 0;
    c.maxLoad = RHO * c.area * H;       // lb, the most the hull can displace
    c.reserve = c.maxLoad - c.total;    // lb more before the water comes over the top
    c.displaced = Math.min(c.total, c.maxLoad) / RHO;   // ft^3
    
    // Transverse stability of a box: KB = draft / 2, BM = I / V = W^2 / (12 draft)
    c.KB = c.draft / 2;
    c.BM = W * W / (12 * c.draft);
    c.KG = c.total > 0 ? (G * SEAT_CG + S * SEAT_CG + B * H / 2 + LW * CARGO_CG) / c.total : H / 2;
    c.GM = c.KB + c.BM - c.KG;
    c.stable = c.GM > 0;
    
    // And along the length
    c.BML = L * L / (12 * c.draft);
    c.GML = c.KB + c.BML - c.KG;
    
    // Where the two passengers sit so the moments about the middle cancel:
    //   G * x1 + S * x2 = 0, with x2 - x1 = spread
    c.spread = Math.min(Math.max(L - SEAT_LEN, 0), 2 * SEAT_LEN);
    c.x1 = G + S > 0 ? c.spread * S / (G + S) : 0;     // ft from the middle, toward the bow (right)
    c.x2 = G + S > 0 ? -c.spread * G / (G + S) : 0;    // toward the stern (left)
    c.fits = L >= 2 * SEAT_LEN;
    
    // How far the boat would tip if they sat the same distance from the middle instead
    var moment = (G - S) * c.spread / 2;                // lb ft
    c.naiveTrim = c.total > 0 && c.GML > 0 ? Math.atan(moment / (c.total * c.GML)) : 0;  // rad
    c.naiveDip = Math.tan(Math.abs(c.naiveTrim)) * L / 2; // ft, how far the low end goes down
    
    // Heel for every inch a passenger shifts sideways
    c.heelPerInch = c.total > 0 && c.GM > 0 ? Math.atan(Math.max(G, S) / 12 / (c.total * c.GM)) : Math.PI / 2;
    
    c.freeboardColor = !c.floats ? SUNK_COLOR : c.freeboard < CLOSE_FREEBOARD * H ? CLOSE_COLOR : OK_COLOR;
    c.gmColor = !c.stable ? SUNK_COLOR : c.GM < CLOSE_GM ? CLOSE_COLOR : OK_COLOR;
    
    return c;
}

// Ease what is drawn toward the calculated numbers, with a little overshoot like a boat settling
function settle()
{
    var k = .12, damp = .72;
    var targets = [Math.min(calc.draft, boatDimensions[2] * 1.5), calc.x1, calc.x2];
    var keys = ["draft", "x1", "x2"];
    
    for (var i = 0; i < keys.length; i++)
    {
        if (first)
        {
            shown[keys[i]] = targets[i];
            continue;
        }
        shown.v[i] += (targets[i] - shown[keys[i]]) * k;
        shown.v[i] *= damp;
        shown[keys[i]] += shown.v[i];
    }
}

// The scale that fits every view on the canvas
function scale()
{
    var L = boatDimensions[0], W = boatDimensions[1], H = boatDimensions[2];
    var side = mc.width * .6, end = mc.width * .4;
    return Math.min(SCALE, (side - 40) / L, (end - 40) / W, 110 / H, (mc.width - 60) / L, 130 / W);
}

function round(n)
{
    var acc = Math.pow(10, 3);
    return Math.round(n * acc) / acc;
}

function fmtLen(ft)
{
    if (units == "m")
        return round(ft / ftInMeter) + " m";
    return round(ft) + " ft (" + Math.round(ft * 12 * 10) / 10 + " in)";
}

function fmtWt(lb)
{
    if (units == "m")
        return round(lb * kgInLbs) + " kg";
    return round(lb) + " lb";
}

function fmtVol(ft3)
{
    if (units == "m")
        return round(ft3 / Math.pow(ftInMeter, 3)) + " m^3";
    return round(ft3) + " ft^3";
}

function fmtDeg(rad)
{
    return Math.round(rad * 180 / Math.PI * 10) / 10 + "°";
}

function drawWhy()
{
    var c = calc, L = boatDimensions[0], W = boatDimensions[1], H = boatDimensions[2];
    var lines = [];
    
    lines.push("<b>" + (!c.floats ? "Sinks." : c.freeboard < CLOSE_FREEBOARD * H ? "Floats, barely." : "Floats.") + " " +
               (!c.stable ? "Tips over." : c.GM < CLOSE_GM ? "Tippy." : "Stable.") + "</b>");
    lines.push("Total weight " + fmtWt(c.total) + " = " + fmtWt(G) + " + " + fmtWt(S) + " + " + fmtWt(B) + " boat + " + fmtWt(LW) + " leeway");
    lines.push("Waterplane " + fmtLen(L) + " x " + fmtLen(W) + ", water " + (units == "m" ? "1000 kg/m^3" : RHO + " lb/ft^3"));
    lines.push("Draft = weight / (water x area) = " + fmtLen(c.draft) + (LW ? " (" + fmtLen(c.draft0) + " without leeway)" : ""));
    lines.push("Freeboard = " + fmtLen(H) + " - draft = " + (c.floats ? fmtLen(c.freeboard) : "none, it is " + fmtLen(-c.freeboard) + " under"));
    lines.push("Displaces " + fmtVol(c.displaced) + "; the hull can hold " + fmtWt(c.maxLoad) + " in all, " + (c.reserve >= 0 ? fmtWt(c.reserve) + " more" : fmtWt(-c.reserve) + " too much"));
    lines.push("Stability: KB " + fmtLen(c.KB) + " + BM " + fmtLen(c.BM) + " - KG " + fmtLen(c.KG) + " = GM " + fmtLen(c.GM) +
               (c.stable ? " (M above G)" : " (G above M)"));
    lines.push(c.stable ? "Every inch a passenger shifts sideways heels it " + fmtDeg(c.heelPerInch) : "It rolls over as soon as anyone leans");
    lines.push("Seats: passenger 1 " + fmtLen(Math.abs(c.x1)) + " from the middle, passenger 2 " + fmtLen(Math.abs(c.x2)) + " the other way, so " +
               fmtWt(G) + " x " + round(c.x1) + " = " + fmtWt(S) + " x " + round(-c.x2) + " and it sits level" +
               (c.fits ? "" : "; but " + fmtLen(L) + " is too short for two people"));
    if (c.naiveDip > .001)
        lines.push("Sitting the same distance from the middle would tip it " + fmtDeg(c.naiveTrim) + ", the " + (G > S ? "bow" : "stern") + " down " + fmtLen(c.naiveDip));
    
    document.getElementById("why").innerHTML = lines.join("<br />");
}

//
// Side view: the length of the boat, sunk by the draft
function drawSide()
{
    var sc = scale(), L = boatDimensions[0], H = boatDimensions[2];
    var cx = mc.width * .3, wy = mc.height * .38;
    var yd = shown.draft;
    
    drawWater(0, wy, mc.width * .6, mc.height * .62);
    
    // Ghost: the boat with no sinking distance
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 255, 255, .6)";
    ctx.strokeStyle = "rgba(0, 0, 0, .6)";
    ctx.rect(cx - L / 2 * sc, wy - H * sc, L * sc, H * sc);
    ctx.fill();
    ctx.stroke();
    
    drawHull(cx, wy, L, H, yd, sc);
    
    // Seats, as seen from the side
    drawSeat(cx + shown.x1 * sc, wy + (yd - cheightft) * sc, sc, "1");
    drawSeat(cx + shown.x2 * sc, wy + (yd - cheightft) * sc, sc, "2");
    
    // Forces
    var fscale = Math.max(calc.maxLoad, calc.total) / 120;
    var top = wy - (H - yd) * sc;
    drawArrow(cx, top, calc.total / fscale, "purple", fmtWt(calc.total) + " down");
    drawArrow(cx, top, -calc.maxLoad / fscale, "gray", "");
    drawArrow(cx, top, -Math.min(calc.total, calc.maxLoad) / fscale, calc.floats ? "green" : "red", fmtWt(Math.min(calc.total, calc.maxLoad)) + " up");
    
    var fs = 14;
    ctx.font = fs + "px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText("Side view", 6, fs + 2);
    ctx.fillText("Draft " + fmtLen(calc.draft), 6, fs * 2 + 4);
    ctx.fillText("Freeboard " + (calc.floats ? fmtLen(calc.freeboard) : "none"), 6, fs * 3 + 6);
    ctx.fillText("Displaced " + fmtVol(calc.displaced), 6, fs * 4 + 8);
    
    ctx.textAlign = "center";
    ctx.fillText(fmtLen(L), cx, wy + Math.max(yd, 0) * sc + fs + 6);
}

// End view: the width of the boat with K, B, G and M on the centreline
function drawEnd()
{
    var sc = scale(), W = boatDimensions[1], H = boatDimensions[2];
    var cx = mc.width * .8, wy = mc.height * .38;
    var yd = shown.draft;
    
    ctx.beginPath();
    ctx.strokeStyle = "gray";
    ctx.moveTo(mc.width * .6, 0);
    ctx.lineTo(mc.width * .6, mc.height * .62);
    ctx.stroke();
    
    drawWater(mc.width * .6, wy, mc.width * .4, mc.height * .62);
    drawHull(cx, wy, W, H, yd, sc);
    
    var keel = wy + yd * sc;
    var pts = [["K", 0, "black"], ["B", calc.KB, "blue"], ["G", calc.KG, "purple"], ["M", calc.KB + calc.BM, calc.stable ? "green" : "red"]];
    var fs = 14;
    ctx.font = "bold " + fs + "px Arial";
    ctx.textAlign = "left";
    
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 0, .4)";
    ctx.moveTo(cx, keel + 4);
    ctx.lineTo(cx, Math.min(keel - (calc.KB + calc.BM) * sc, wy - H * sc) - 8);
    ctx.stroke();
    
    for (var i = 0; i < pts.length; i++)
    {
        var y = keel - pts[i][1] * sc;
        ctx.beginPath();
        ctx.fillStyle = pts[i][2];
        ctx.arc(cx, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(pts[i][0], cx + 8 + (i % 2) * 14, y + 5);
    }
    
    ctx.font = fs + "px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("End view", mc.width * .6 + 6, fs + 2);
    ctx.fillText("GM " + fmtLen(calc.GM), mc.width * .6 + 6, fs * 2 + 4);
    ctx.textAlign = "center";
    ctx.fillText(fmtLen(W), cx, wy + Math.max(yd, 0) * sc + fs + 6);
}

// Top view: where the two passengers sit
function drawTop()
{
    var sc = scale(), L = boatDimensions[0], W = boatDimensions[1];
    var cx = mc.width / 2, cy = mc.height * .81;
    
    ctx.beginPath();
    ctx.strokeStyle = "gray";
    ctx.moveTo(0, mc.height * .62);
    ctx.lineTo(mc.width, mc.height * .62);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.fillStyle = BOAT_COLOR;
    ctx.strokeStyle = BOAT_BORDER;
    ctx.lineWidth = 2;
    ctx.rect(cx - L / 2 * sc, cy - W / 2 * sc, L * sc, W * sc);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1;
    
    // The middle
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 0, .35)";
    ctx.setLineDash([3, 3]);
    ctx.moveTo(cx, cy - W / 2 * sc);
    ctx.lineTo(cx, cy + W / 2 * sc);
    ctx.moveTo(cx - L / 2 * sc, cy);
    ctx.lineTo(cx + L / 2 * sc, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    
    drawSeat(cx + shown.x1 * sc, cy, sc, "1", true);
    drawSeat(cx + shown.x2 * sc, cy, sc, "2", true);
    
    var fs = 14;
    ctx.font = fs + "px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText("Top view: " + fmtWt(G) + " sits " + fmtLen(Math.abs(calc.x1)) + " right of the middle, " + fmtWt(S) + " sits " + fmtLen(Math.abs(calc.x2)) + " left", 6, mc.height * .62 + fs + 2);
    if (!calc.fits)
    {
        ctx.fillStyle = "red";
        ctx.fillText("Too short for two people sitting (" + fmtLen(2 * SEAT_LEN) + " needed)", 6, mc.height * .62 + fs * 2 + 4);
    }
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("stern", cx - L / 2 * sc - 22, cy + 5);
    ctx.fillText("bow", cx + L / 2 * sc + 18, cy + 5);
}

// A box hull of width w and height h, centred on cx, sunk yd below the water at wy,
// with the freeboard band coloured by how much is left
function drawHull(cx, wy, w, h, yd, sc)
{
    var top = wy - (h - yd) * sc, bottom = wy + yd * sc;
    
    ctx.beginPath();
    ctx.fillStyle = BOAT_COLOR;
    ctx.strokeStyle = BOAT_BORDER;
    ctx.rect(cx - w / 2 * sc, top, w * sc, h * sc);
    ctx.fill();
    ctx.stroke();
    
    // Bottom layer of cardboard
    ctx.beginPath();
    ctx.fillStyle = "brown";
    ctx.strokeStyle = "black";
    ctx.rect(cx - w / 2 * sc, bottom - cheightft * sc, w * sc, cheightft * sc);
    ctx.fill();
    ctx.stroke();
    
    // Freeboard
    ctx.beginPath();
    ctx.fillStyle = calc.freeboardColor;
    if (top < wy)
        ctx.rect(cx - w / 2 * sc, top, w * sc, wy - top);
    else
        ctx.rect(cx - w / 2 * sc, wy, w * sc, top - wy);
    ctx.fill();
    
    // Waterline through the hull
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 200, .8)";
    ctx.moveTo(cx - w / 2 * sc, wy);
    ctx.lineTo(cx + w / 2 * sc, wy);
    ctx.stroke();
}

function drawSeat(x, y, sc, label, top)
{
    var r = Math.max(SEAT_LEN / 2 * sc * .75, 6);
    ctx.beginPath();
    ctx.fillStyle = label == "1" ? "rgba(200, 50, 200, .7)" : "rgba(50, 150, 200, .7)";
    ctx.strokeStyle = "black";
    if (top)
        ctx.arc(x, y, r, 0, Math.PI * 2);
    else
        ctx.arc(x, y - r, r, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = "white";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, x, (top ? y : y - r / 2) + 4);
}

function drawArrow(x, y, len, color, label)
{
    var arrx = 6, arry = 6 * (len < 0 ? -1 : 1);
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + len);
    ctx.moveTo(x, y + len);
    ctx.lineTo(x + arrx, y + len - arry);
    ctx.moveTo(x, y + len);
    ctx.lineTo(x - arrx, y + len - arry);
    ctx.stroke();
    
    if (label)
    {
        ctx.font = "13px Arial";
        ctx.fillStyle = color;
        ctx.textAlign = "left";
        ctx.fillText(label, x + 8, len > 0 ? y + len + 14 : y + len / 2 + 5);   // a down arrow ends in the water, so its label goes past the tip
    }
    ctx.restore();
}

function drawWater(x, wy, w, h)
{
    ctx.beginPath();
    ctx.save();
    ctx.fillStyle = WATER_COLOR;
    ctx.strokeStyle = WATER_TOP;
    
    ctx.moveTo(x - 1, wy);
    ctx.lineTo(x + w + 1, wy);
    ctx.lineTo(x + w + 1, h + 1);
    ctx.lineTo(x - 1, h + 1);
    
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
