//
var WATER_COLOR = "rgba(150, 150, 255, .4)", WATER_TOP = "rgba(50, 50, 255, .4)",
    BOAT_COLOR = "sandybrown", BOAT_BORDER = "brown",
    SCALE = 35;

//
var mc, ctx;
var boatDimensions = [6, 4, 2],
    G = 200, S = 120, B = 10, LW = 200;    // Lbs

var ftInMeter = 3.28084,
    kgInLbs = 0.453592;

var first = true, dim;
var cheight = .0258, cheightft = cheight * ftInMeter;

window.onload = function()
{
    mc = document.createElement("canvas");
    
    mc.style.background = "linear-gradient(to bottom right, white, lightblue)";
    mc.style.borderRadius = "5px";
    mc.style.border = "1px solid gray";
    mc.style["box-shadow"] = "5px 5px 5px rgba(100, 100, 100, .4)";
    mc.width = Math.min(640, window.innerWidth - 10);
    mc.height = 480;
    mc.style.maxWidth = window.innerWidth + "px";
    
    ctx = mc.getContext("2d");
    document.body.appendChild(mc);
    
    document.getElementById("showinfo").onclick = function(){
        alert("This tool was created in order to help one get a rough idea of what their boat's dimensions will be according to a few changeable variables, as listed below.  The dimensions are in the format 'width by depth by height'.  Leeway weight is included in order to see how much you can add into your boat before it sinks.\nAs for the drawing assembled itself, the white \"ghost\" shows where the boat would be without any sinking distance.  The brown base is the bottom layer of cardboard (with an assumed cardboard thickness of " + round(cheight) + " m (" + round(cheightft) + " ft)).  And, of course, the sandy brown rectangular box is the boat itself.\nMade By Steven O'Riley");
    };
    
    dim = document.getElementById("dimensions");
    
    _loop();
}

function _loop()
{
    requestAnimationFrame(_loop);
    mc.width = mc.width;
    
    getStuff();
    
    drawWater();
    drawBoat(true);
    drawBoat();
    drawCalculations();
    
    first = false;
}

function getStuff()
{
    var dv = dim.value.replace(/ |\n|\t/g, "");
    var sp = dv.split("x");
    
    boatDimensions[0] = +sp[0] || 1;
    boatDimensions[1] = +sp[1] || 1;
    boatDimensions[2] = +sp[2] || 1;
    
    G = +document.getElementById("gw").value || 0;
    S = +document.getElementById("sw").value || 0;
    B = +document.getElementById("bw").value || 0;
    LW = +document.getElementById("ew").value || 0;
}

function calculateSdist()
{
    var boat = (S + G + B) * kgInLbs;   // kg
    var combined = boat + LW * kgInLbs; // kg
    
    var V = (boatDimensions[0] * boatDimensions[1] * boatDimensions[2]) / Math.pow(ftInMeter, 3);   // m^3
    var p = 1000;   // kg/m^3
    var m = p * V;
    
    var Fw = combined * 9.807;
    var FB = m * 9.807;
    
    var bw = FB / Fw;
    
    var fscale = 1000;
    var wlen = SCALE * Fw / fscale;
    var blen = Math.min(SCALE * FB / fscale, wlen);
    var mlen = SCALE * FB / fscale;
    
    var vw = (boatDimensions[0] + 2 * boatDimensions[2]) / ftInMeter; // m
    var vd = (boatDimensions[1] + 2 * boatDimensions[2]) / ftInMeter; // m
    
    return Fw / (9.807 * p * vw * vd);
}

function drawCalculations()
{
    // Calculate the stuff
    var boat = (S + G + B) * kgInLbs;   // kg
    var combined = boat + LW * kgInLbs; // kg
    
    // m = pV
    var V = (boatDimensions[0] * boatDimensions[1] * boatDimensions[2]) / Math.pow(ftInMeter, 3);   // m^3
    var p = 1000;   // kg/m^3
    var m = p * V;
    
    var Fw = combined * 9.807;
    var FB = m * 9.807;
    
    var bw = FB / Fw;
    
    var fscale = 1000;
    var wlen = SCALE * Fw / fscale;
    var blen = Math.min(SCALE * FB / fscale, wlen);
    var mlen = SCALE * FB / fscale;
    
    // pAh = m
    // Fw = mg
    // Fw = pAhg
    // h = F_w / g / p / A
    
    var vw = (boatDimensions[0] + 2 * boatDimensions[2]) / ftInMeter; // m
    var vd = (boatDimensions[1] + 2 * boatDimensions[2]) / ftInMeter; // m
    
    var sdist = calculateSdist(); // m
    // F_w = F_fluid
    
    //
    // Force of Weight
    ctx.beginPath();
    ctx.save();
    ctx.lineWidth = 3;
    
    var arrx = 6, arry = 6;
    
    ctx.strokeStyle = "purple";
    ctx.moveTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE);
    ctx.lineTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE + wlen);
    
    ctx.moveTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE + wlen);
    ctx.lineTo(mc.width / 2 + arrx, mc.height / 2 - boatDimensions[2] / 2 * SCALE + wlen - arry);
    ctx.moveTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE + wlen);
    ctx.lineTo(mc.width / 2 - arrx, mc.height / 2 - boatDimensions[2] / 2 * SCALE + wlen - arry);
    
    ctx.stroke();
    
    // Max Marker
    ctx.beginPath();
    ctx.strokeStyle = "gray";
    
    ctx.moveTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE);
    ctx.lineTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE - mlen);
    
    ctx.moveTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE - mlen);
    ctx.lineTo(mc.width / 2 + arrx, mc.height / 2 - boatDimensions[2] / 2 * SCALE - mlen + arry);
    ctx.moveTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE - mlen);
    ctx.lineTo(mc.width / 2 - arrx, mc.height / 2 - boatDimensions[2] / 2 * SCALE - mlen + arry);
    
    ctx.stroke();
    
    // Buoyant Force
    ctx.beginPath();
    ctx.strokeStyle = Fw > FB ? "red" : "green";
    
    ctx.moveTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE);
    ctx.lineTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE - blen);
    
    ctx.moveTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE - blen);
    ctx.lineTo(mc.width / 2 + arrx, mc.height / 2 - boatDimensions[2] / 2 * SCALE - blen + arry);
    ctx.moveTo(mc.width / 2, mc.height / 2 - boatDimensions[2] / 2 * SCALE - blen);
    ctx.lineTo(mc.width / 2 - arrx, mc.height / 2 - boatDimensions[2] / 2 * SCALE - blen + arry);
    
    ctx.stroke();
    ctx.beginPath();
    var fs = 24;
    
    ctx.font = fs + "px Arial";
    ctx.fillStyle = "purple";
    ctx.fillText(round(Fw) + " N", mc.width / 2 + 5, mc.height / 2 - boatDimensions[2] / 2 * SCALE + wlen / 2 + fs / 2);
    
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(round(Math.min(Fw, FB)) + " N", mc.width / 2 + 5, mc.height / 2 - boatDimensions[2] / 2 * SCALE - blen / 2 + fs / 2);
    
    var rV = vw * vd * sdist;
    ctx.fillStyle = "black";
    
    ctx.fillText("(Cardboard Thickness: .0258 m)", 2, fs + 2);
    ctx.fillText("Float Line: " + round(sdist) + " m (" + round(sdist * ftInMeter) + " ft)", 2, fs * 2 + 2);
    ctx.fillText("Displaced Water: " + round(rV) + " m^3 (" + round(rV * Math.pow(ftInMeter, 3)) + " ft^3)", 2, fs * 3 + 2);
    
    ctx.restore();
}

function round(n)
{
    var acc = Math.pow(10, 3);
    return Math.round(n * acc) / acc;
}

function drawBoat(ov)
{
    ctx.beginPath();
    ctx.fillStyle = ov ? "rgba(255, 255, 255, .6)" : BOAT_COLOR;
    ctx.strokeStyle = ov ? "rgba(0, 0, 0, .6)" : BOAT_BORDER;
    
    var yd = ov ? 0 : calculateSdist() * ftInMeter;
    ctx.moveTo(mc.width / 2 - boatDimensions[0] / 2 * SCALE, mc.height / 2 - (boatDimensions[2] - yd) * SCALE);
    ctx.lineTo(mc.width / 2 + boatDimensions[0] / 2 * SCALE, mc.height / 2 - (boatDimensions[2] - yd) * SCALE);
    ctx.lineTo(mc.width / 2 + boatDimensions[0] / 2 * SCALE, mc.height / 2 + yd * SCALE);
    ctx.lineTo(mc.width / 2 - boatDimensions[0] / 2 * SCALE, mc.height / 2 + yd * SCALE);
    ctx.lineTo(mc.width / 2 - boatDimensions[0] / 2 * SCALE, mc.height / 2 - (boatDimensions[2] - yd) * SCALE);
    
    ctx.fill();
    ctx.stroke();
    
    if (!ov)
    {
        ctx.beginPath();
        ctx.fillStyle = "brown";
        ctx.strokeStyle = "black";
        
        ctx.moveTo(mc.width / 2 - boatDimensions[0] / 2 * SCALE, mc.height / 2 - (cheightft - yd) * SCALE);
        ctx.lineTo(mc.width / 2 + boatDimensions[0] / 2 * SCALE, mc.height / 2 - (cheightft - yd) * SCALE);
        ctx.lineTo(mc.width / 2 + boatDimensions[0] / 2 * SCALE, mc.height / 2 + yd * SCALE);
        ctx.lineTo(mc.width / 2 - boatDimensions[0] / 2 * SCALE, mc.height / 2 + yd * SCALE);
        ctx.lineTo(mc.width / 2 - boatDimensions[0] / 2 * SCALE, mc.height / 2 - (cheightft - yd) * SCALE);
        
        ctx.fill();
        ctx.stroke();
    }
}

function drawWater()
{
    ctx.beginPath();
    ctx.save();
    //ctx.setLineDash([3]);
    ctx.fillStyle = WATER_COLOR;
    ctx.strokeStyle = WATER_TOP;
    
    ctx.moveTo(-1, mc.height / 2);
    ctx.lineTo(mc.width + 1, mc.height / 2);
    ctx.lineTo(mc.width + 1, mc.height + 1);
    ctx.lineTo(-1, mc.height + 1);
    
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
