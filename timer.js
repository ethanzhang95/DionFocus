var timeTotal = 0;
let minutes=0;
let seconds=0;
let status = 'work';
let buttonstatus = 'start';
let sessionNums = 0;
var startAudio = new Audio('startsound.mp3');
var stopAudio = new Audio('stopsound.mp3');
let buttonstart = document.querySelector('.startbutton');
let interval = null;
function startStop(){
    if(buttonstatus == 'start')
    {
        buttonstatus = 'stop';
        interval = setInterval(myTimer, 1000);
        document.getElementById("startbutton").innerHTML = 'Pause';
    }
    else
    {
        buttonstatus = 'start';
        clearInterval(interval);
        document.getElementById("startbutton").innerHTML = 'Start';
    }
}
function myTimer() {
    timeTotal++;
    if(timeTotal/60 === 1)
    {
        minutes++;
        timeTotal = 0;
    }
    if(minutes === 25 && timeTotal===0 && status == 'work')
    {
        startAudio.play();
        timeTotal = 0;
        minutes = 0;
        alert('take a break!');
        status = 'break';
        interval = null;
    }
    if(minutes === 5 && timeTotal===0 && status == 'break')
    {
        stopAudio.play();
        timeTotal = 0;
        minutes = 0;
        alert('Break time is over!');
        status = 'work';
        interval = null;
    }
    document.getElementById("demo").innerHTML = pad(minutes) + ":" + pad(timeTotal);
}
function pad(a)
{
    if(a<10)
        return "0"+a;
    return a;
}