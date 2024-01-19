import {
    dragstarted,
    dragged,
    dragended,
} from "./interactions.js";

import {
    showNodeTitle,
    hideNodeTitle
} from "./utils.js"

function getNodeIndex(GlobalState, id) {
    for (var i = 0; i < GlobalState.data.nodes.length; i++) {
        if (id == GlobalState.data.nodes[i].id) return i;
    }
}

function createSimulation(GlobalState) {

  GlobalState.data.links.forEach(e => {
        e.source = getNodeIndex(GlobalState, e.source);
        e.target = getNodeIndex(GlobalState, e.target);
    });
  
  GlobalState.simulation = cola.d3adaptor(d3)
    .size([GlobalState.width, GlobalState.height])
    .avoidOverlaps(true)
    .handleDisconnected(false);


  GlobalState.simulation
      .nodes(GlobalState.data.nodes)
      .links(GlobalState.data.links)
      .flowLayout("x", 40)
      .linkDistance(40)
      .symmetricDiffLinkLengths(100)
      .avoidOverlaps(true)
      .start(50, 50, 150);
}  

function updateSimulation(GlobalState) {  
  GlobalState.simulation  
    .nodes(GlobalState.data.nodes)  
    .links(GlobalState.data.links)
    .start();
}

function createArrowMarkers(GlobalState) {  
    const arrowMarkers = GlobalState.svg.append("defs")  
    .selectAll("marker")  
    .data(GlobalState.data.nodes)  
    .join("marker")
    .attr("class", "arrow_marker")
    .attr("id", d => `arrow-${d.id}`)  
    .attr("viewBox", "0 -5 10 10")  
    .attr("refX", d => d.id?.toLowerCase().match(/start|end/gi) ? 17 : 17)
    .attr("refY", 0)
    .attr("markerWidth", 10)  
    .attr("markerHeight", 10)  
    .attr("orient", "auto")  
    .append("path")  
    .attr("d", "M0,-5L10,0L0,5")  
    .attr("color", "#000");  

    return GlobalState;
}  

function createLink(GlobalState) {  
    GlobalState.link = GlobalState.g.append("g")
        .attr("stroke", "black")  
        .attr("stroke-opacity", 0.2)  
        .selectAll("line")  
        .data(GlobalState.data.links)  
        .join("line")  
        .attr("stroke-width", 4)
        .attr("marker-end", d => `url(#arrow-${d.target.id})`)
        .classed("link", true);

}  

function createNode(GlobalState) {  
       GlobalState.node = GlobalState.g.append("g")
            .attr("stroke", "black")  
            .attr("stroke-width", 1.5)  
            .selectAll("g")  
            .data(GlobalState.data.nodes)  
            .join("g")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))

        GlobalState.node
            .append("circle")  
            .attr("r", d => d.id?.toLowerCase().match(/start|end/gi) ? 60 : 40)
 
        GlobalState.node
            .attr("fill", d => GlobalState.color(4))

        GlobalState.node.filter(d => d.id?.toLowerCase().match(/start|end/gi))
            .attr("fill", d => GlobalState.color(2))

}

function createLabel(GlobalState) {  
    GlobalState.label = GlobalState.g.selectAll(".label")
        .data(GlobalState.data.nodes)  
        .enter().append("text")  
        .attr("class", "label")
        .text(d => d.id?.toLowerCase().match("start|end") ? d.id : d.summary)
        .style("text-anchor", "middle")  
        .style("color", "#000")
        .style("font-family", "Arial")  
        .style("font-size", "40px")
        .style("font-weight", "bold")
        .style("stroke", "white")
        .style("stroke-width", 1)
        .attr("transform", d => `translate(0, -55)`)
} 

function createNrBeatSelection(GlobalState) {  
    GlobalState.nrBeatSelection = GlobalState.g.selectAll(".nr_beat")
        .data(GlobalState.data.nodes)  
        .enter().append("text")  
        .attr("class", "nr_beat")  
        .text(d => d.nr_beat)  
        .style("text-anchor", "middle")  
        .style("fill", "#333")  
        .style("font-family", "Arial")  
        .style("font-size", "30px");
} 


function createBeatTitleSelection(GlobalState){
    GlobalState.titleBeatSelection = GlobalState.g.selectAll(".beat_title")
    .data(GlobalState.data.nodes)  
    .enter().append("text")  
    .attr("class", "beat_title")  
    .text(d => d.beat)  
    .style("text-anchor", "left")  
    .style("fill", "#333")
    .style("font-family", "Arial")  
    .style("font-size", "35px")
    .style("visibility", "hidden");

    GlobalState.node
        .on("mouseover", (event, d) => {
            console.log(GlobalState.titleBeatSelection._groups[0][d.index].innerHTML);
            showNodeTitle(GlobalState, d);
        })
        .on("mouseout", (event, d) => {
            hideNodeTitle(GlobalState, d);
        });

    GlobalState.node
        .attr("tabindex", 0)
        .on("focus", (event, d) => {
            console.log(GlobalState.titleBeatSelection._groups[0][d.index].innerHTML);
            showNodeTitle(GlobalState, d);
        })
        .on("blur", (event, d) => {
            hideNodeTitle(GlobalState, d);
        });

}
 
function updateLinkPosition(GlobalState) {  
    GlobalState.link  
        .attr("x1", d => adjustLinkPosition(d).x1)  
        .attr("y1", d => adjustLinkPosition(d).y1)  
        .attr("x2", d => adjustLinkPosition(d).x2)  
        .attr("y2", d => adjustLinkPosition(d).y2);  
  
    function adjustLinkPosition(d) {  
        const deltaX = d.target.x - d.source.x;  
        const deltaY = d.target.y - d.source.y;  
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);  
  
        const targetScale = (distance - 15) / distance;
        const sourceScale = 10  / distance;
  
        const targetX = d.source.x + (deltaX * targetScale);  
        const targetY = d.source.y + (deltaY * targetScale);  
  
        const sourceX = d.source.x + (deltaX * sourceScale);  
        const sourceY = d.source.y + (deltaY * sourceScale);  
  
        return { x1: sourceX, y1: sourceY, x2: targetX, y2: targetY };  
    }  
}  

  
function updateNodePosition(GlobalState) {  
    GlobalState.node  
        .attr("transform", d => `translate(${d.x}, ${d.y})`);  
}  

  
function updateLabelPosition(GlobalState) {  
    GlobalState.label  
        .attr("x", d => d.x)  
        .attr("y", d => d.y - 10);
}  
  
function updateNrBeatPosition(GlobalState) {  
    GlobalState.nrBeatSelection
        .attr("x", d => d.x)  
        .attr("y", d => d.y + 5 );
}

function updateTitleBeatPosition(GlobalState) {  
    GlobalState.titleBeatSelection
        .attr("x", d => d.x + 40)  
        .attr("y", d => d.y + 40 );
}  

function updateGraph(GlobalState) {  

  resetGraphState(GlobalState);  

  updateSimulation(GlobalState);  
  
  createArrowMarkers(GlobalState);  
  
  createLink(GlobalState);  
  
  createNode(GlobalState);  
 
  GlobalState.node.call(d3.drag()
    .on("start", (event, d) => dragstarted(GlobalState, event, d))
    .on("drag", (event, d) => dragged(GlobalState, event, d))
    .on("end", (event, d) => dragended(GlobalState, event, d)));

  createLabel(GlobalState);  
  
  createNrBeatSelection(GlobalState);

  createBeatTitleSelection(GlobalState);

  GlobalState.simulation.on("tick", () => {  
    updateLinkPosition(GlobalState);  
    updateNodePosition(GlobalState);  
    updateLabelPosition(GlobalState);  
    updateNrBeatPosition(GlobalState);
    updateTitleBeatPosition(GlobalState);
  });

}  


function resetGraphState(GlobalState) {

    GlobalState.svg.on(".zoom", null);

    if (GlobalState.node) {
        GlobalState.node.selectAll(".node").on(".drag", null);  
    }

    GlobalState.g.selectAll("*").remove();

    GlobalState.svg.call(d3.zoom().on("zoom", (event) => {
    GlobalState.g.attr("transform", event.transform);
    }));

}

export {
    createSimulation, 
    updateSimulation, 
    createArrowMarkers, 
    createLink, 
    createNode, 
    createLabel, 
    createNrBeatSelection,
    createBeatTitleSelection,
    updateLinkPosition, 
    updateNodePosition, 
    updateLabelPosition, 
    updateNrBeatPosition,
    updateTitleBeatPosition,
    updateGraph,
    resetGraphState,
}