function difference (a, b) {
  return new Set([...a].filter(x => !b.has(x)));
}

async function setOptions (event) {
  const dropdowns = {  
    'fav-fairytales': 'Tales',  
    'fav-starts': 'Starts',  
    'fav-endings': 'Endings',
    'fav-storylines': 'Storylines',
    'fav-grounded-on': 'GroundedOn', 
  };
  const changedIdx = Object.keys(dropdowns).findIndex(key => key == event.target.id)
  const priors = Object.keys(dropdowns).slice(0, changedIdx + 1).map(key => document.getElementById(key).value).map(val => {
    const idx = Object.values(this.mappings).findIndex(value => value == val)
    return idx == -1 ? val : Object.keys(this.mappings)[idx]
  }).join('-');
  const remaining = this.availableGraphs.filter(graph => graph.startsWith(priors));
  const options = {
    'fav-fairytales': new Set(),
    'fav-starts': new Set(),
    'fav-endings': new Set(),
    'fav-storylines': new Set(),
    'fav-grounded-on': new Set(),
  }
  remaining.forEach((graph) => {
    const g = graph.split('-');
    options['fav-fairytales'].add(g[0])
    options['fav-starts'].add(g[1])
    options['fav-endings'].add(g[2])
    options['fav-storylines'].add(g[3])
    options['fav-grounded-on'].add(g[4])
  });
  for (let i = changedIdx + 1; i < Object.keys(dropdowns).length; i++) {
    const dropdown = document.getElementById(Object.keys(dropdowns)[i]);
    difference(this.options[Object.keys(dropdowns)[i]], options[Object.keys(dropdowns)[i]]).forEach(option => {
    })
  }

  switch (changedIdx) {
    case 1:
      if (event.target.value == "1") {
        document.getElementById("fav-endings").value = "2"
        document.getElementById("fav-storylines").value = "4"
      } else {
        document.getElementById("fav-endings").value = "4"
        document.getElementById("fav-storylines").value = "8"
      }
      break;
      case 2:
        if (event.target.value == "2") {
          document.getElementById("fav-starts").value = "1"
          document.getElementById("fav-storylines").value = "4"
        } else {
        document.getElementById("fav-starts").value = "2"
        document.getElementById("fav-storylines").value = "8"
      }
      break;
      case 3:
        if (event.target.value == "4") {
          document.getElementById("fav-starts").value = "1"
          document.getElementById("fav-endings").value = "2"
        } else {
          document.getElementById("fav-starts").value = "2"
          document.getElementById("fav-endings").value = "4"
        }
      break;
  }
  
  const optionsSelected = [];  
  
  for (const dropdownId in dropdowns) {  
    const dropdown = document.getElementById(dropdownId);
    const selectedOption = dropdown.value;  
    const descriptiveTerm = dropdowns[dropdownId];  

    if (selectedOption !== ""){
      optionsSelected.push(`${descriptiveTerm}: ${selectedOption}`);
    }
  }  
  
  window.selectedOptionsString = optionsSelected.join(', \n');  
  console.log(`in setOptions Window.selectedOptionsString: ${window.selectedOptionsString}`);

}


function restartAfresh() {
  location.reload(true);
}


function getFileName(inputString) {
  const regex = /Tales:\s*([\w\s]+),\s*Starts:\s*(\d+),\s*Endings:\s*(\d+),\s*Storylines:\s*(\d+),\s*GroundedOn:\s*(\w+)/;
  const matches = inputString.match(regex);
  
  if (matches) {
    const [, tales, starts, endings, storylines, groundedOn] = matches;
    const formattedTales = tales.toLowerCase().replace(/\s/g, '');
    const formattedGroundedOn = groundedOn.toLowerCase().replace(/\s/g, '');
    return `${formattedTales}-${starts}-${endings}-${storylines}-${formattedGroundedOn}-graph.json`;
  }
  
  return null;
}

function showNodeTitle(GlobalState, d){
  d3.select(GlobalState.titleBeatSelection._groups[0][d.index]).style("visibility", "visible");
}

function hideNodeTitle(GlobalState, d){
  d3.select(GlobalState.titleBeatSelection._groups[0][d.index]).style("visibility", "hidden");
}



export {
    setOptions,
    getFileName,
    restartAfresh,
    showNodeTitle,
    hideNodeTitle,
}