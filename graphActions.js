import {
  fetchData,
  loadOptions,
} from './data.js';

import {
    createSimulation, 
    updateGraph,
} from './graphElements.js';

import {
  getFileName,
  setOptions,
} from "./utils.js";

const config = {  
  colorScheme: d3.schemeTableau10,
};  

window.selectedOptionsString = '';

const GlobalState = {  
  width: window.innerWidth,  
  height: window.innerHeight,  
  color: d3.scaleOrdinal(config.colorScheme).domain(["1","2","3","4","5","6","7","8","9","10"]),
  model: "gpt-4-32k", //"gpt-4-0314", "gpt-4-0613", "gpt-4"
  data: null,
  selectedFile: "",
  nrBeatSelection: null,
  titleBeatSelection: null,
  selectedOption: {
    Tales: null,
    Starts: null,
    Endings: null,
    Storylines: null,
    GroundedOn: null,
  },

  options: {},
  availableGraphs: [],
  outputs: {
    options: '',
    stories_draft: '',
  },
  mappings: {
    'dracula': 'Dracula',
    'frankenstein': 'Frankenstein',
    'littleredridinghood': 'Little Red Riding Hood',
    'jackandthebeanstalk': 'Jack and the Beanstalk',
    'minecraft': 'Minecraft',
    '21stcentury': '21stCentury',
    'ancientrome': 'AncientRome',
    'quantum': 'Quantum Realm',
  },
  svg: null,
  node: null,
  label: null,
  g: null,
  contextMenu: null,
  simulation: null
};


GlobalState.svg = d3.select("#graph").append("svg")  
    .attr("viewBox", [0, 0, GlobalState.width, GlobalState.height]);  

GlobalState.g = GlobalState.svg.append("g").attr("transform", "translate(" + GlobalState.width/3 + "," + GlobalState.height/6 + ") scale(" + 0.5 + ")");

await loadOptions(GlobalState);

console.log(`GlobalState.data: ${GlobalState.data}`);

GlobalState.contextMenu = d3.select("#context-menu");

const translateX = GlobalState.width/2 ;
const translateY = GlobalState.height/2;
const scale = 1.3;


GlobalState.svg.call(d3.zoom().on("zoom", (event) => {  
    GlobalState.g.attr("transform", event.transform);  
}));  


window.addEventListener("click", () => {
    GlobalState.contextMenu.style("display", "none");
});  

d3.select("#edit").on("click", () => handleEditClick(GlobalState));  
d3.select("#delete").on("click", () => handleDeleteClick(GlobalState));  
d3.select("#copy").on("click", () => handleCopyClick(GlobalState));  
d3.select("#paste").on("click", () => handlePasteClick(GlobalState));  
d3.select("#add-node").on("click", () => handleAddNodeClick(GlobalState));  
d3.select("#add-edge").on("click", () => handleAddEdgeClick(GlobalState));
d3.select("#play-video").on("click", () => handlePlayVideoClick(GlobalState));

const inputDesign = document.getElementById('inputDesign');

const getGraphButton = document.getElementById('getGraphButton');
var toggleTextAreaButton = document.getElementById("toggleTextAreaButton");
var textAreaVar = document.getElementsByClassName('textarea-container')[0]; 

const fairytalesSelect = document.getElementById('fav-fairytales');
const startsSelect = document.getElementById('fav-starts');
const endingsSelect = document.getElementById('fav-endings');
const storylinesSelect = document.getElementById('fav-storylines');
const groundedOnSelect = document.getElementById('fav-grounded-on');

fairytalesSelect.addEventListener('change', setOptions.bind(GlobalState));  
startsSelect.addEventListener('change', setOptions.bind(GlobalState));  
endingsSelect.addEventListener('change', setOptions.bind(GlobalState));
storylinesSelect.addEventListener('change', setOptions.bind(GlobalState));
groundedOnSelect.addEventListener('change', setOptions.bind(GlobalState));


getGraphButton.addEventListener('click', async () => {

    if (window.selectedOptionsString === ""){
      window.alert("You must select options before generating a graph!");
      return;
    }

    try {

      console.log(`inputName: ${getFileName(window.selectedOptionsString)}`);

      GlobalState.selectedFile = getFileName(window.selectedOptionsString);

        if (GlobalState.selectedFile) {
           await fetchData(GlobalState);

           if (GlobalState.data === null){
              return;
           }

           createSimulation(GlobalState);
           updateGraph(GlobalState);


          console.log(`** getGraphButton data.outputs.stories_draft: ${GlobalState.data.outputs.stories_draft}`);

          if (GlobalState.data.outputs.stories_draft != ""){

              inputDesign.value = GlobalState.data.outputs.stories_draft.trimStart();

              console.log(`** getGraphButton inputDesign.value: ${inputDesign.value}`);
          }
          
         }

          window.addEventListener("click", () => {
              GlobalState.contextMenu.style("display", "none");
          });


    } catch(error) {
      console.error(`error: ${error.message}`);
    }

});

toggleTextAreaButton.addEventListener("click", function() { 
  this.classList.toggle("active");
  toggleTextAreaButton.setAttribute('aria-expanded', textAreaVar.style.display === 'block');

  if (textAreaVar.style.display !== "block") {
    textAreaVar.style.display = "block";
    toggleTextAreaButton.innerHTML = "Hide details";  
  } else {
    textAreaVar.style.display = "none";  
    toggleTextAreaButton.innerHTML = "Show details";  
  }  
});  

window.selectedOptionsString = "Tales: Dracula, Starts: 1, Endings: 2, Storylines: 4, GroundedOn: Minecraft";
getGraphButton.click();