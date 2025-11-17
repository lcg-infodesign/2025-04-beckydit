// VARIABILI GLOBALI
let volcanoData;
let activeTypeCategory = 'All'; 
let allTypeCategories = []; 
let typeSelect; 
let hoveredVolcano = null;

let volcanoDetails = {
    name: "No volcano selected", 
    country: "...",
    typeCategory: "...",
    elev: "...",
};

// VARIABILI IMMAGINI
let volcanoImages = {};
let placeholderImage; 

// VARIABILI SIDEBAR
let sidebarVisible = false;
const SIDEBAR_WIDTH = 300; 
let selectedVolcano = null; 
let isDescriptionVisible = false;

// COSTANTI LAYOUT
const PADDING = 20;
const LINE_HEIGHT = 20;
const NAME_LINE_HEIGHT = 30;
const SPACE_X = 10; 
const IMAGE_SIZE = 150; 

// PARAGRAFI 
const volcanoDescriptions = {
    "Caldera": "A large, bowl-shaped or elliptical depression formed when a volcano's summit collapses, often following a massive, violent eruption that empties the underlying magma chamber. They frequently contain lakes.",
    "Cone": "These generally refer to Cinder Cones, the simplest and smallest volcanoes. They are built from fragments of erupted lava (cinders or lapilli) that fall back down around the vent, accumulating into a conical shape with a bowl-shaped crater at the top. Eruptions are typically short-lived.",
    "Crater System": "A complex, often elongated group of craters or vents in a volcanic field. This indicates multiple, closely associated eruptive centers rather than a single main cone, suggesting shifting activity or linear fault control.",
    "Maars / Tuff ring": "A Maar is a broad, low-relief volcanic crater caused by a shallow explosive eruption (phreatomagmatic) that interacts with groundwater. A Tuff Ring is a similar, low, flat structure formed by layers of ash and rock fragments deposited around the explosion vent.",
    "Shield Volcano": "Large volcanoes with very gentle slopes formed by flows of low-viscosity, fluid lava that spread out over vast areas before cooling. Their eruptions are generally effusive (non-explosive).",
    "Stratovolcano": "Tall, conical volcanoes characterized by steep slopes and built up by alternating layers of solidified lava flows, volcanic ash, and pyroclastic material. Their eruptions are often explosive due to viscous lava.",
    "Subglacial": "A volcano that has erupted beneath a glacier or ice sheet. The interaction between the lava and the ice creates distinctive, flat-topped, steep-sided mountains called tuyas or can result in large meltwater floods (jökulhlaups).",
    "Submarine Volcano": "A volcano located entirely beneath the surface of the sea or ocean. Active submarine volcanoes can release heated chemicals, form unique deep-sea ecosystems, and may eventually grow large enough to become volcanic islands.",
    "Other / Unknown": "Detailed type information is not available for this volcano.",
};

// FUNZIONI TESTO SPEZZATO
function isNameWrapped(name) {
    const segments = name.split(/[\s_-]+/).filter(s => s.length > 0);
    return segments.length > 3; 
}
// posiziona il titolo del paragrafo in base alle righe del nome
function calculateDescriptionTitleY() {
    let currentY = PADDING * 2; 
    let volcanoName = volcanoDetails.name;
    
    if (isNameWrapped(volcanoName)) {
        currentY += NAME_LINE_HEIGHT; 
    }
    
    currentY += PADDING * 1.5;
    currentY += LINE_HEIGHT * 6;
    
    return currentY; 
}

function textHeight(textStr, w) {
    textSize(16); 
    let charLengthEstimate = 30; 
    let numLines = ceil(textStr.length / charLengthEstimate);
    return numLines * LINE_HEIGHT;
}


// PRELOAD
function preload() {

  try {
      volcanoData = loadTable("volcanoes.csv", "csv", "header");
  } catch (e) {
      console.error("Errore nel caricamento di volcanoes.csv:", e);
  }


  try {
      placeholderImage = loadImage('images/placeholder.png'); 
  } catch (e) {
      console.warn("Immagine placeholder 'images/placeholder.png' non trovata. Impossibile caricare immagini mancanti.");
  }


  const imageMap = {
    "Caldera": 'images/caldera.png',
    "Cone": 'images/cone.png',
    "Crater System": 'images/cratersystem.png',
    "Maars / Tuff ring": 'images/maarstuffring.png',
    "Shield Volcano": 'images/shieldvolcano.png',
    "Stratovolcano": 'images/stratovolcano.png',
    "Subglacial": 'images/subglacial.png',
    "Submarine Volcano": 'images/submarinevolcano.png',
  };

  for (const type in imageMap) {
    try {
        volcanoImages[type] = loadImage(imageMap[type]);
    } catch (e) {
        console.warn(`Immagine per ${type} non trovata. Uso il placeholder.`);
        volcanoImages[type] = placeholderImage; 
    }
  }

  volcanoImages["Other / Unknown"] = placeholderImage;
}

// SETUP
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('serif'); 
  textAlign(LEFT, CENTER);
  noStroke();

  initializeDropdown();
  positionDropdown();
}

// DRAW
function draw() {
  background(220, 220, 215); 

  const metrics = calculateMapMetrics();
  const { mapX, mapY, mapW, mapH, availableWidth } = metrics;
  
  drawTitle(availableWidth);

  const BOX_HEIGHT = 90; 
  const BOX_W = 250; 
  const gap = 10;
  
  let totalBoxesW = BOX_W * 2 + gap * 1;
  let offsetX = (mapW - totalBoxesW) / 2;
  let startX = mapX + offsetX;

  
  drawVolcanoes(mapX, mapY, mapW, mapH);
 
  drawLegendBox(startX, mapY + mapH + 10, BOX_W, BOX_HEIGHT);

  let filterBoxX = startX + BOX_W + gap;
  drawTypeFilterBox(filterBoxX, mapY + mapH + 10, BOX_W, BOX_HEIGHT);

  if (sidebarVisible) {
    drawSidebarPanel();
  }
}

function mouseClicked() {
  const boxX = width - SIDEBAR_WIDTH; 
  const buttonSize = 15; 
  
  // controlla il clic sulla x per chiudere
  if (sidebarVisible) {
    let closeX = boxX + SIDEBAR_WIDTH - PADDING * 1.5;
    let closeY = PADDING * 1.5;

    if (mouseX > closeX - buttonSize && mouseX < closeX + buttonSize &&
        mouseY > closeY - buttonSize && mouseY < closeY + buttonSize) {
        
        sidebarVisible = false;
        selectedVolcano = null;
        isDescriptionVisible = false;
        volcanoDetails = { name: "No volcano selected", country: "...", typeCategory: "...", elev: "...", };
        positionDropdown();
        return; 
    }
  }
  
  // controlla il clic su "What is a...?" 
  if (sidebarVisible && selectedVolcano) {
      const titleY = calculateDescriptionTitleY(); 
      const titleText = `What is a ${volcanoDetails.typeCategory}?`;
      
      textSize(16); 
      let titleW = textWidth(titleText); 
      
      if (mouseX > boxX + PADDING && mouseX < boxX + PADDING + titleW &&
          mouseY > titleY - 10 && mouseY < titleY + 10) { 
          
          isDescriptionVisible = !isDescriptionVisible;
          return; 
      }
  }
  
  // clic sul vuclano
  let closestVolcano = findClickedVolcano();

  if (closestVolcano) {
    sidebarVisible = true;
    selectedVolcano = closestVolcano; 
    isDescriptionVisible = false;
    
    volcanoDetails = {
        name: selectedVolcano.name,
        country: selectedVolcano.country,
        typeCategory: selectedVolcano.typeCategory,
        elev: `${nf(selectedVolcano.elev, 0, 0)} m`,
    };
  } 
  
  positionDropdown();
}

// manina su "What is a...?"
function mouseMoved() {
    if (sidebarVisible && selectedVolcano) {
        const boxX = width - SIDEBAR_WIDTH; 
        const titleY = calculateDescriptionTitleY(); 
        const titleText = `What is a ${volcanoDetails.typeCategory}?`;
        textSize(16); 
        let titleW = textWidth(titleText); 
        
        if (mouseX > boxX + PADDING && mouseX < boxX + PADDING + titleW &&
            mouseY > titleY - 10 && mouseY < titleY + 10) {
            cursor(HAND);
            return;
        }
    }
    cursor(ARROW);
}


// DISEGNO SIDEBAR
function drawSidebarPanel() {
    const boxX = width - SIDEBAR_WIDTH; 
    const boxH = height;
     
    push();
    fill(245, 245, 240, 255); 
    noStroke();              
    rect(boxX, 0, SIDEBAR_WIDTH, boxH); 

    // X CHIUSURA 
    const buttonSize = 15; 
    let closeX = boxX + SIDEBAR_WIDTH - PADDING * 1.5;
    let closeY = PADDING * 1.5;
    stroke(139, 69, 19); 
    strokeWeight(1.5);   
    line(closeX - buttonSize/2, closeY - buttonSize/2, closeX + buttonSize/2, closeY + buttonSize/2);
    line(closeX + buttonSize/2, closeY - buttonSize/2, closeX - buttonSize/2, closeY + buttonSize/2); 
    noStroke();
    
    // NOME VULCANO
    fill(100, 50, 0); 
    textSize(24);
    textStyle(BOLD);
    textAlign(LEFT, TOP);

    let volcanoName = volcanoDetails.name;
    let currentY = PADDING * 2;
    
    let line1 = volcanoName; 
    let line2 = null;
    

    if (isNameWrapped(volcanoName)) {
        let splitPoint = -1;
        
        // cerca l'ultimo spazio, trattino o underscore nel primo 70% del nome
        let searchLength = Math.floor(volcanoName.length * 0.7);
        for (let i = searchLength; i >= 0; i--) {
            let char = volcanoName[i];
            if (char === ' ' || char === '-' || char === '_') {
                splitPoint = i;
                break;
            }
        }
        
        if (splitPoint > 0) {
            line1 = volcanoName.substring(0, splitPoint);
            line2 = volcanoName.substring(splitPoint + 1);
        } else {
            // Fallback: spezza a metà
            let middle = Math.floor(volcanoName.length / 2);
            line1 = volcanoName.substring(0, middle) + '-';
            line2 = volcanoName.substring(middle);
        }
    }

    // disegna il nome
    text(line1, boxX + PADDING, currentY);
    
    if (line2 && line2.length > 0) {
        currentY += NAME_LINE_HEIGHT;
        text(line2, boxX + PADDING, currentY);
    }
    
    // linea divisoria
    let dividerY = currentY + PADDING * 1.5;

    // DETTAGLI VULCANO
    stroke(139, 69, 19);
    line(boxX + PADDING, dividerY, boxX + SIDEBAR_WIDTH - PADDING, dividerY);
    noStroke(); 
    textStyle(NORMAL);
    
    fill(20); 
    textSize(16); 
    currentY = dividerY + LINE_HEIGHT; 
    
    textStyle(BOLD);
    let countryLabel = "Country:";
    text(countryLabel, boxX + PADDING, currentY);
    textStyle(NORMAL); 
    let countryText = volcanoDetails.country;
    let textStartCountry = boxX + PADDING + textWidth(countryLabel) + SPACE_X;
    text(countryText, textStartCountry, currentY);
    currentY += LINE_HEIGHT;
    
    textStyle(BOLD);
    let typeLabel = "Type:";
    text(typeLabel, boxX + PADDING, currentY);
    textStyle(NORMAL); 
    let typeText = volcanoDetails.typeCategory;
    let textStartType = boxX + PADDING + textWidth(typeLabel) + SPACE_X;
    text(typeText, textStartType, currentY);
    currentY += LINE_HEIGHT;
    
    textStyle(BOLD);
    let elevLabel = "Elevation:";
    text(elevLabel, boxX + PADDING, currentY);
    textStyle(NORMAL); 
    let elevText = volcanoDetails.elev;
    let textStartElev = boxX + PADDING + textWidth(elevLabel) + SPACE_X;
    text(elevText, textStartElev, currentY);
    currentY += LINE_HEIGHT * 2; 

    // WHAT IS A 
    let descriptionTitle = `What is a ${typeText}?`;
    let titleY = calculateDescriptionTitleY(); 
    
    if (mouseX > boxX + PADDING && mouseX < boxX + SIDEBAR_WIDTH - PADDING &&
        mouseY > titleY - 10 && mouseY < titleY + 10) {
        textStyle(BOLD);
        fill(100, 50, 0); 
    } else {
        textStyle(NORMAL); 
        fill(100, 50, 0);
    }

    textSize(16);
    text(descriptionTitle, boxX + PADDING, titleY);
    textStyle(NORMAL); 
    
    currentY = titleY + 25; 

    // PARAGRAFO
    if (isDescriptionVisible) {
        // Fallback per la descrizione: se typeText non è in volcanoDescriptions (es. "Complex volcano"), usa "Other / Unknown"
        let descriptionText = volcanoDescriptions[typeText] || volcanoDescriptions["Other / Unknown"];
        
        fill(20); 
        textSize(16); 
        
        let textW = SIDEBAR_WIDTH - 2 * PADDING;
        
        text(descriptionText, boxX + PADDING, currentY, textW, boxH - currentY - PADDING);
        
        let textH = textHeight(descriptionText, textW);
        
     // IMMAGINE
        let currentImage = volcanoImages[typeText] || placeholderImage; 
        
        if (currentImage) {
            let imageY = currentY + textH + 20; 
            let imageX = boxX + (SIDEBAR_WIDTH - IMAGE_SIZE) / 2; 

            image(currentImage, imageX, imageY, IMAGE_SIZE, IMAGE_SIZE);
        }
    }
    
    pop();
}

// WINDOW RESIZED
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionDropdown();
}

// DIMENSIONI E POSIZIONI
function calculateMapMetrics() {
  let availableWidth = width;
  if (sidebarVisible) { availableWidth -= SIDEBAR_WIDTH; }
  let mapMargin = 20;
  let mapY = 135; 
  let maxMapW = availableWidth - 2 * mapMargin;
  let maxMapH = height - mapY - 130; 
  const baseW = 2000;
  const baseH = 1000;
  let scaleFactor = min(maxMapW / baseW, maxMapH / baseH);
  let mapW = baseW * scaleFactor;   
  let mapH = baseH * scaleFactor;
  let mapX = (availableWidth - mapW) / 2;
  return { mapX, mapY, mapW, mapH, availableWidth };
}

// DROPDOWN FILTRO
function initializeDropdown() {
  allTypeCategories = []; 
  for (let r = 0; r < volcanoData.getRowCount(); r++) {
    let type = volcanoData.getRow(r).get("TypeCategory");
    if (type && type.trim() !== '') {
      let cleanedType = type.trim();
      if (!allTypeCategories.includes(cleanedType)) { allTypeCategories.push(cleanedType); }
    }
  }
  allTypeCategories.sort();
  allTypeCategories.unshift('All');
  if (typeSelect) { typeSelect.remove(); }
  typeSelect = createSelect();
  typeSelect.changed(typeSelected); 
  typeSelect.style('font-family', 'serif');
  typeSelect.style('font-size', '14px');
  typeSelect.style('padding', '5px');
  typeSelect.style('border-radius', '4px');
  typeSelect.style('border', '1px solid #c0c0c0');
  for (let category of allTypeCategories) { typeSelect.option(category); }
  typeSelect.selected('All');
}
function positionDropdown() {
    const metrics = calculateMapMetrics();
    const { mapX, mapY, mapW, mapH } = metrics;
    const BOX_W = 250; 
    let gap = 10;
    let padding = 10;
    let totalBoxesW = BOX_W * 2 + gap * 1; 
    let offsetX = (mapW - totalBoxesW) / 2;
    let startX = mapX + offsetX;
    let filterBoxX = startX + BOX_W + gap;
    const vOffset = 20; 
    let newX = filterBoxX + padding; 
    let newY = mapY + mapH + 10 + vOffset + 20; 
    typeSelect.position(newX, newY); 
    typeSelect.size(BOX_W - (padding * 2), 30);
}

// TROVA VULCANO CLICCATO
function findClickedVolcano() {
  let closestDist = Infinity;
  let clickedVolcano = null; 
  const FIXED_SIZE = 10; 
  const metrics = calculateMapMetrics();
  const { mapX, mapW, mapY, mapH } = metrics;
  for (let r = 0; r < volcanoData.getRowCount(); r++) {
    let row = volcanoData.getRow(r);
    let lat = float(row.get("Latitude"));
    let lon = float(row.get("Longitude"));
    let typeCategory = row.get("TypeCategory");

    // ignora se non corrisponde al tipo selezionato
    if (activeTypeCategory !== 'All' && typeCategory !== activeTypeCategory) {
        continue;
    }
    
    let x = map(lon, -180, 180, mapX, mapX + mapW); 
    let y = map(lat, 90, -90, mapY, mapY + mapH); 
    let d = dist(mouseX, mouseY, x, y);
    if (d < max(FIXED_SIZE, 8) && d < closestDist) {
      closestDist = d;
      clickedVolcano = { 
        name: row.get("Volcano Name") || "Unknown",
        country: row.get("Country") || "Unknown",
        typeCategory: typeCategory,
        elev: float(row.get("Elevation (m)")),
        rowIndex: r
      }; 
    }
  }
  return clickedVolcano;
}
function typeSelected() { 
  activeTypeCategory = typeSelect.value(); 
}

// MAP COLORE ATTIVITA
function getActivityScore(status) {
  switch (status) {
    case 'D5': case 'U': case 'Holocene': return 0.2;
    case 'D4': return 0.4;
    case 'D3': return 0.6;
    case 'D2': return 0.8;
    case 'D1': case 'Historical': return 1.0;
    default: return 0.1; 
  }
}

// TITOLO E SOTTOTITOLO
function drawTitle(availableWidth) {
  noStroke(); 
  textAlign(CENTER, CENTER);
  textFont('serif'); 
  fill(100, 50, 0); 
  let centerX = availableWidth / 2;
  textSize(50);
  text("Volcanoes of the World", centerX, 50);
  textSize(16);
  text("Each point represents a volcano. Click for details!", centerX, 85);
}

//DISEGNO VULCANI
function drawVolcanoes(mapX, mapY, mapW, mapH) {
  hoveredVolcano = null;
  let closestDist = Infinity;
  const FIXED_SIZE = 10; 

  if (selectedVolcano && sidebarVisible) {
     volcanoDetails = {
        name: selectedVolcano.name,
        country: selectedVolcano.country,
        typeCategory: selectedVolcano.typeCategory,
        elev: `${nf(selectedVolcano.elev, 0, 0)} m`,
    };
  } else if (!sidebarVisible) {
    volcanoDetails = {
        name: "No volcano selected",
        country: "...",
        typeCategory: "...",
        elev: "...",
    };
  }

  for (let r = 0; r < volcanoData.getRowCount(); r++) {
    let row = volcanoData.getRow(r);
    let lat = float(row.get("Latitude"));
    let lon = float(row.get("Longitude"));
    let typeCategory = row.get("TypeCategory");
    let elev = float(row.get("Elevation (m)"));
    let name = row.get("Volcano Name") || "Unknown";
    let country = row.get("Country") || "Unknown"; 
    let status = row.get("Last Known Eruption");

    // FILTRO: Ignora se non corrisponde al tipo selezionato
    if (activeTypeCategory !== 'All' && typeCategory !== activeTypeCategory) {
        continue;
    }
    
    let x = map(lon, -180, 180, mapX, mapX + mapW);
    let y = map(lat, 90, -90, mapY, mapY + mapH); 
    
    let size = FIXED_SIZE; 
    let score = getActivityScore(status);
    let c = lerpColor(color(255, 255, 100), color(200, 30, 30), score); // colore attività mappato
    
    let alphaVal = 255 * 0.7; 
    let cAlpha = color(red(c), green(c), blue(c), alphaVal);

    let d = dist(mouseX, mouseY, x, y);
    if (d < max(size, 8) && d < closestDist) {
      closestDist = d;
      
      if (!sidebarVisible) {
        hoveredVolcano = { name, country, typeCategory, elev, x, y, size, rowIndex: r };
        volcanoDetails = {
            name: hoveredVolcano.name,
            country: hoveredVolcano.country, 
            typeCategory: hoveredVolcano.typeCategory,
            elev: `${nf(hoveredVolcano.elev, 0, 0)} m`,
        };
      }
    }
    
    noStroke();
    fill(cAlpha);
    ellipse(x, y, size, size);

    let isHovered = hoveredVolcano && hoveredVolcano.rowIndex === r && !sidebarVisible;
    let isSelected = selectedVolcano && selectedVolcano.rowIndex === r;
    
    if (isHovered || isSelected) {
      noStroke(); 
      fill(100, 50, 0, alphaVal);
      ellipse(x, y, size * 1.5, size * 1.5);
    }
  }
}

// LEGENDA
function drawLegendBox(boxX, boxY, boxW, boxH) {
  let barW = boxW - 20;
  const vOffset = 31; 
  push();
  fill(245, 245, 240, 255); 
  stroke(139, 69, 19);
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 8); 
  let barY = boxY + vOffset; 
  let barH = 10;
  noStroke(); 
  textSize(12);
  fill(100, 50, 0); 
  textFont('serif');
  textAlign(LEFT, TOP);
  text("Less Active", boxX + 10, barY + barH + 5);
  textAlign(RIGHT, TOP);
  text("More Active", boxX + barW + 10, barY + barH + 5); 
  textAlign(LEFT, TOP); 
  for (let i = 0; i < barW; i++) {
    let c = lerpColor(color(255, 255, 100), color(200, 30, 30), map(i, 0, barW, 0, 1));
    stroke(c);
    line(boxX + 10 + i, barY, boxX + 10 + i, barY + barH);
  }
  pop();
}

// DROPDOWN
function drawTypeFilterBox(boxX, boxY, boxW, boxH) {
    let padding = 10;
    const vOffset = 20; 
    push();
    fill(245, 245, 240, 255); 
    stroke(139, 69, 19);
    strokeWeight(2);
    rect(boxX, boxY, boxW, boxH, 8); 
    noStroke();
    textSize(14);
    fill(100, 50, 0);
    textFont('serif');
    textAlign(LEFT, TOP);
    text("Filter by Volcano Type:", boxX + padding, boxY + vOffset); 
    typeSelect.position(boxX + padding, boxY + vOffset + 20);
    typeSelect.size(boxW - (padding * 2), 30); 
    pop();
}