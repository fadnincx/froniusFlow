/**
 * PV System Current Flow
 * by Marcel WÃ¼rsten (inspiration Fronius Solarweb), 18.8.2021
 */

// Strings
lang = {
 battery_charge_w: 'Akku wird mit {0} W geladen!',
 battery_charge_kw: 'Akku wird mit {0} kW geladen!',
 battery_discharge_w: 'Akku wird mit {0} W entladen!',
 battery_discharge_kw: 'Akku wird mit {0} kW entladen!'
};

// define local constants
pv_kwp = 9.99         // Insert your local PV kWp to adjust the pv production bar




// define variabls that needed to be updated
let pv_txt = null, grid_txt = null, consumption_txt = null, battery_txt = null;
let pv_bar = null, grid_bar = null, consumption_bar = null, battery_bar = null;
let battery_img = [];
let pv_blobs = [], grid_blobs = [], consumption_blobs = [], battery_blobs = [];
let pv_blobs_dir = 0, grid_blobs_dir = 0, consumption_blobs_dir = 0, battery_blobs_dir = 0;
let battery_info_rect = null, battery_info_text = null;

/*
 * Updates the data with new values from fronius
 */
function updateData(){

 // Fetch the flow data
 fetch("solar_api/v1/GetPowerFlowRealtimeData.fcgi")
 .then(response => response.json())
 .then(function (data) {

  // extract intressting values from response
  soc = data['Body']['Data']['Inverters']['1']['SOC']
  p_akku = data['Body']['Data']['Site']['P_Akku']
  p_grid = data['Body']['Data']['Site']['P_Grid']
  p_load = data['Body']['Data']['Site']['P_Load']
  p_pv = data['Body']['Data']['Site']['P_PV']

  // Set the new text values in the circles
  pv_txt.text(p_pv>=1000?(parseFloat((p_pv/1000).toFixed(2)).toLocaleString()+"kW"):(parseFloat(p_pv.toFixed(0)).toLocaleString()+"W"))
  grid_txt.text(Math.abs(p_grid)>=1000?(parseFloat((Math.abs(p_grid)/1000).toFixed(2)).toLocaleString()+"kW"):(parseFloat(Math.abs(p_grid).toFixed(0)).toLocaleString()+"W"))
  consumption_txt.text(Math.abs(p_load)>=1000?(parseFloat((Math.abs(p_load)/1000).toFixed(2)).toLocaleString()+"kW"):(parseFloat(Math.abs(p_load).toFixed(0)).toLocaleString()+"W"))
  battery_txt.text(parseFloat(soc.toFixed(0)).toLocaleString()+"%")

  // Set the new bars
  pv_bar.attr({d:getCircleSegmentPath(75, 75, 0, Math.max(Math.min(Math.sqrt(Math.abs(p_pv))*(270*Math.sqrt(pv_kwp)),270),0))})
  consumation_bar.attr({d:getCircleSegmentPath(325, 75, 0, Math.max(Math.min(Math.sqrt(Math.abs(p_load))*1.9,270),0))})
  battery_bar.attr({d:getCircleSegmentPath(325, 325, 0, Math.max(Math.min(soc*2.7),0))})

  // Update battery image
  battery_img.forEach(img => img.hide())
  if(p_akku<0 && soc<=25){
   battery_img['c25'].show()
  }else if(p_akku<0 && soc<=50){
   battery_img['c50'].show()
  }else if(p_akku<0 && soc<=75){
   battery_img['c75'].show()
  }else if(p_akku<0 && soc<100){
   battery_img['c100'].show()
  }else if(soc>95){
   battery_img['100'].show()
  }else if(soc>75){
   battery_img['75'].show()
  }else if(soc>50){
   battery_img['50'].show()
  }else if(soc>25){
   battery_img['25'].show()
  }else{
   battery_img['0'].show()
  }

  // Update Blobsize
  for(i = 0; i<5; ++i){
    pv_blobs[i].radius(Math.sqrt(Math.abs(p_pv))/10)
    grid_blobs[i].radius(Math.sqrt(Math.abs(p_grid))/10)
    consumption_blobs[i].radius(Math.sqrt(Math.abs(p_load))/10)
    battery_blobs[i].radius(Math.sqrt(Math.abs(p_akku))/10)
  }

  // Update Blob direction
  pv_blobs_dir = p_pv>0?1:0
  grid_blobs_dir = p_grid>0?1:-1
  consumption_blobs_dir = p_load>0?-1:1
  battery_blobs_dir = p_akku>0?1:-1

  // Update battery info text
  battery_info_text.text(((p_akku>0)?((p_akku>=1000)?lang.battery_discharge_kw:lang.battery_discharge_w):((p_akku<=-1000)?lang.battery_charge_kw:lang.battery_charge_w)).replace('{0}',((Math.abs(p_akku)>=1000)?parseFloat((Math.abs(p_akku)/1000).toFixed(2)).toLocaleString():parseFloat(Math.abs(p_akku).toFixed(0)).toLocaleString())))
  battery_info_rect.attr({width:(battery_info_text.length()+10), x:(385-battery_info_text.length())})


  });
}

/*
 * Calculate the circle segment for the bars
 */
function getCircleSegmentPath(offsetX,offsetY,startAngle,endAngle){

 // Add angle offset
 startAngle+=180
 endAngle+=180

 // reverse angle and convert degree to radiant
 startAngle *= -1*(Math.PI / 180)
 endAngle *= -1*(Math.PI / 180)

 // calculate the 4 points
 const P1_x = (Math.sin(startAngle)*50)+offsetX
 const P1_y = (Math.cos(startAngle)*50)+offsetY
 const P2_x = (Math.sin(endAngle)*50)+offsetX
 const P2_y = (Math.cos(endAngle)*50)+offsetY
 const P3_x = (Math.sin(endAngle)*35)+offsetX
 const P3_y = (Math.cos(endAngle)*35)+offsetY
 const P4_x = (Math.sin(startAngle)*35)+offsetX
 const P4_y = (Math.cos(startAngle)*35)+offsetY

 return "M "+P1_x+" "+P1_y+" A 50 50 0 "+(Math.abs(startAngle-endAngle>Math.PI)?1:0)+" 1 "+P2_x+" "+P2_y+" L "+P3_x+" "+P3_y+" A 35 35 0 "+(Math.abs(startAngle-endAngle>Math.PI)?1:0)+" 0 "+P4_x+" "+P4_y+" L "+P1_x+" "+P1_y+" Z";
}
/*
 * Calculate the circle secment line
 */
function getCircleSegmentLine(offsetX,offsetY,angle){
  // add angle offset
  angle+=180
  // reverse angle and convert degree to radiant
  angle *= -1*(Math.PI / 180)

  return "M "+((Math.sin(angle)*50)+offsetX)+" "+((Math.cos(angle)*50)+offsetY)+" L "+((Math.sin(angle)*35)+offsetX)+" "+((Math.cos(angle)*35)+offsetY)+" Z";
}

/*
 * Animation Loop to move blobs around
 */
function animationLoop(){

 // Animate Step size
 animateMove = 1;

 // Move the blobs around
 for(i = 0; i<5; ++i){
  pv_blobs[i].cx(pv_blobs[i].cx()+(animateMove*pv_blobs_dir)).cy(pv_blobs[i].cy()+(animateMove*pv_blobs_dir))
  if (pv_blobs[i].cx() > 200){
   pv_blobs[i].cx(75).cy(75)
  }else if (pv_blobs[i].cx() < 75){
   pv_blobs[i].cx(200).cy(200)
  }
  grid_blobs[i].cx(grid_blobs[i].cx()+(animateMove*grid_blobs_dir)).cy(grid_blobs[i].cy()-(animateMove*grid_blobs_dir))
  if (grid_blobs[i].cx() > 200){
   grid_blobs[i].cx(75).cy(325)
  }else if (grid_blobs[i].cx() < 75){
   grid_blobs[i].cx(200).cy(200)
  }
  battery_blobs[i].cx(battery_blobs[i].cx()-(animateMove*battery_blobs_dir)).cy(battery_blobs[i].cy()-(animateMove*battery_blobs_dir))
  if (battery_blobs[i].cx() < 200){
   battery_blobs[i].cx(325).cy(325)
  }else if (battery_blobs[i].cx() > 325){
   battery_blobs[i].cx(200).cy(200)
  }
  consumption_blobs[i].cx(consumption_blobs[i].cx()+(animateMove*consumption_blobs_dir)).cy(consumption_blobs[i].cy()-(animateMove*consumption_blobs_dir))
  if (consumption_blobs[i].cx() < 200){
   consumption_blobs[i].cx(325).cy(75)
  }else if (consumption_blobs[i].cx() > 325){
   consumption_blobs[i].cx(200).cy(200)
  }
 }
}


/*
 * When document loaded, start drawing the svg
 */
SVG.on(document, 'DOMContentLoaded', function() {

 // add a SVG to the body
 var draw = SVG().addTo('body')

 // define the view box and scale behaviour
 draw.viewbox(0,0,400,400).attr('preserveAspectRatio', 'xMidYMid meet')
 draw.attr({'style': 'max-height:'+window.innerHeight+'px'})
 window.addEventListener('resize', function(event){
  draw.attr({'style': 'max-height:'+window.innerHeight+'px'})
 },true)

 // Define the blobs
 pv_blobs[0] = draw.circle(0).attr({cx:'75', cy:'75', fill: '#f7c002'})
 pv_blobs[1] = draw.circle(0).attr({cx:'100', cy:'100', fill: '#f7c002'})
 pv_blobs[2] = draw.circle(0).attr({cx:'125', cy:'125', fill: '#f7c002'})
 pv_blobs[3] = draw.circle(0).attr({cx:'150', cy:'150', fill: '#f7c002'})
 pv_blobs[4] = draw.circle(0).attr({cx:'175', cy:'175', fill: '#f7c002'})

 consumption_blobs[0] = draw.circle(0).attr({cx:'325', cy:'75', fill: '#70b0cd'})
 consumption_blobs[1] = draw.circle(0).attr({cx:'300', cy:'100', fill: '#70b0cd'})
 consumption_blobs[2] = draw.circle(0).attr({cx:'275', cy:'125', fill: '#70b0cd'})
 consumption_blobs[3] = draw.circle(0).attr({cx:'250', cy:'150', fill: '#70b0cd'})
 consumption_blobs[4] = draw.circle(0).attr({cx:'225', cy:'175', fill: '#70b0cd'})

 battery_blobs[0] = draw.circle(0).attr({cx:'325', cy:'325', fill: '#6cbe58'})
 battery_blobs[1] = draw.circle(0).attr({cx:'300', cy:'300', fill: '#6cbe58'})
 battery_blobs[2] = draw.circle(0).attr({cx:'275', cy:'275', fill: '#6cbe58'})
 battery_blobs[3] = draw.circle(0).attr({cx:'250', cy:'250', fill: '#6cbe58'})
 battery_blobs[4] = draw.circle(0).attr({cx:'225', cy:'225', fill: '#6cbe58'})

 grid_blobs[0] = draw.circle(0).attr({cx:'75', cy:'325', fill: '#cccccc'})
 grid_blobs[1] = draw.circle(0).attr({cx:'100', cy:'300', fill: '#cccccc'})
 grid_blobs[2] = draw.circle(0).attr({cx:'125', cy:'275', fill: '#cccccc'})
 grid_blobs[3] = draw.circle(0).attr({cx:'150', cy:'250', fill: '#cccccc'})
 grid_blobs[4] = draw.circle(0).attr({cx:'175', cy:'225', fill: '#cccccc'})


 // Draw PV outer, inner circle and add image
 draw.circle(100).attr({cx:'75', cy:'75', fill:'#ffffff', 'fill-opacity':'1', 'stroke-width':'1', stroke:'#fce798'})
 draw.circle(70).attr({cx:'75', cy:'75', fill:'#ffffff', 'stroke-width':'1', stroke:'#fce798'})
 draw.image('pv.svg').attr({width:50, height:50, x:50, y:50})

 // define the pv text 
 pv_txt = draw.textPath("N/A kW","M 37 75 A 38 38 0 0 1 75 37 Z").attr({'font-size':'13px', 'text-anchor':'middle', 'color':'#7f8488', 'startOffset':'25%', 'font-family':'sans-serif'})
 
 // draw the pv bar background and pv bar
 draw.path(getCircleSegmentPath(75,75,0,270)).attr({'fill':'#fce698'})
 pv_bar = draw.path(getCircleSegmentPath(75,75,0,0)).attr({'fill':'#f7c002'})

 // draw the segmentation lines
 draw.path(getCircleSegmentLine(75,75,30)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,60)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,90)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,105)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,120)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,135)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,150)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,165)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,180)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,190)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,200)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,210)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,220)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,230)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,240)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,250)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(75,75,260)).stroke({width:1, color:'#fff'})


 // Draw Grid outer and inner circle and add image
 draw.circle(100).attr({cx:'75', cy:'325', fill: '#ffffff', 'fill-opacity':'1', 'stroke-width':'1', stroke: '#cccccc'})
 draw.circle(70).attr({cx:'75', cy:'325', fill:'#ffffff', 'stroke-width':'1', stroke:'#cccccc'})
 draw.image('grid.svg').attr({width:50, height:50, x:50, y:300})

 // define the grid text
 grid_txt = draw.textPath("N/A kW","M 37 325 A 38 38 0 0 1 75 287 Z").attr({'font-size':'13px', 'text-anchor':'middle', 'color':'#7f8488', 'startOffset':'25%', 'font-family':'sans-serif'})

 // Draw Consumaton outer and inner circle and add image
 draw.circle(100).attr({cx:'325', cy:'75', fill:'#ffffff', 'fill-opacity':'1', 'stroke-width':'1', stroke:'#c6dfeb'})
 draw.circle(70).attr({cx:'325', cy:'75', fill:'#ffffff', 'stroke-width':'1', stroke:'#c6dfeb'})
 draw.image('consumption.svg').attr({width:50, height:50, x:300, y:50})

 // define the consumption text
 consumption_txt = draw.textPath("N/A kW","M 287 75 A 38 38 0 0 1 325 37 Z").attr({'font-size':'13px', 'text-anchor':'middle', 'color':'#7f8488', 'startOffset':'25%', 'font-family':'sans-serif'})

 // draw the consumption bar background and consumption bar
 draw.path(getCircleSegmentPath(325,75,0,270)).attr({'fill':'#c6dfeb'})
 consumation_bar = draw.path(getCircleSegmentPath(325,75,0,0)).attr({'fill':'#70b0cd'})

 // draw the segmentation lines
 draw.path(getCircleSegmentLine(325,75,30)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,60)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,90)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,105)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,120)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,135)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,150)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,165)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,180)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,190)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,200)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,210)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,220)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,230)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,240)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,250)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,75,260)).stroke({width:1, color:'#fff'})


 // Draw Battery outer and inner circle
 batteryOuterCircle = draw.circle(100).attr({cx:'325', cy:'325', fill:'#ffffff', 'fill-opacity':'1', 'stroke-width':'1', stroke: '#b7dfab'})
 batteryCircle = draw.circle(70).attr({cx:'325', cy:'325', fill:'#ffffff', 'stroke-width':'1', stroke:'#b7dfab'})

 // define the battery text
 battery_txt = draw.textPath("N/A %","M 287 325 A 38 38 0 0 1 325 287 Z").attr({'font-size':'13px', 'text-anchor':'middle', 'color':'#7f8488', 'startOffset':'25%', 'font-family':'sans-serif'})

 // draw the battery bar background and battery bar
 batteryBarBackgroud = draw.path(getCircleSegmentPath(325,325,0,270)).attr({'fill':'#b7dfab'})
 battery_bar = draw.path(getCircleSegmentPath(325,325,0,0)).attr({'fill':'#6cbe58'})

 // draw the segmentation lines
 draw.path(getCircleSegmentLine(325,325,27)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,325,54)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,325,81)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,325,108)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,325,135)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,325,162)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,325,189)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,325,216)).stroke({width:1, color:'#fff'})
 draw.path(getCircleSegmentLine(325,325,243)).stroke({width:1, color:'#fff'})

 // define all the battery images
 battery_img['0'] = draw.image('battery_0.svg').attr({width:50,height:50,x:300,y:300})
 battery_img['25'] = draw.image('battery_25.svg').attr({width:50,height:50,x:300,y:300}).hide()
 battery_img['50'] = draw.image('battery_50.svg').attr({width:50,height:50,x:300,y:300}).hide()
 battery_img['75'] = draw.image('battery_75.svg').attr({width:50,height:50,x:300,y:300}).hide()
 battery_img['100'] = draw.image('battery_100.svg').attr({width:50,height:50,x:300,y:300}).hide()
 battery_img['c25'] = draw.image('battery_charging_25.svg').attr({width:50,height:50,x:300,y:300}).hide()
 battery_img['c50'] = draw.image('battery_charging_50.svg').attr({width:50,height:50,x:300,y:300}).hide()
 battery_img['c75'] = draw.image('battery_charging_75.svg').attr({width:50,height:50,x:300,y:300}).hide()
 battery_img['c100'] = draw.image('battery_charging_100.svg').attr({width:50,height:50,x:300,y:300}).hide()

 // define the battery hover area
 draw.circle(100).fill('#ffffff').attr({cx:'325', cy:'325', fill:'#00ffff', 'fill-opacity':'0', 'stroke-width':'0', onmouseover:'showBatteryInfo()', onmouseout: 'hideBatteryInfo()', ontouchstart:'showBatteryInfo()', ontouchend:'hideBatteryInfo()'})

 // define battery info
 battery_info_rect = draw.rect(230,29).move(160,370).attr({fill:'#ffffff', 'fill-opacity':'1', 'stroke-width':'1', 'stroke':'#6cbe58', 'display':'none'})
 battery_info_text = draw.plain('').attr({x:'390', y:'390', 'font-size':'15px', 'text-anchor':'end', 'alignment-baseline':'middle', 'color':'#7f8488', 'font-family':'sans-serif', 'display':'none'})


 // draw Fronius in the middle
 draw.circle(100).attr({ cx: '200' , cy: '200' , fill: '#ffffff' , 'fill-opacity': '1', 'stroke-width':'1', stroke: '#cccccc'})
 draw.circle(70).attr({cx:'200',cy:'200',fill:'#ffffff','stroke-width':'1',stroke:'#cccccc'})
 draw.image('inverter_gen24.svg').attr({width:50,height:50,x:175,y:175})


 // initialize the update data loop
 setInterval(updateData,1000)

 // initialize the animation loop
 setInterval(animationLoop,20)

})

/*
 * Funtions to show/hide battery info
 */
function showBatteryInfo(){
 battery_info_text.attr({'display':''})
 battery_info_rect.attr({width:(battery_info_text.length()+10), x:(385-battery_info_text.length())})
 battery_info_rect.attr({'display':''})
}
function hideBatteryInfo(){
 battery_info_rect.attr({'display':'none'})
 battery_info_text.attr({'display':'none'})
}

