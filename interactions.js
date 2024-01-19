function dragstarted(GlobalState, event, d) {
    d.dragOrigin = {
        x: d.x,
        y: d.y
    }
}  

function dragged(GlobalState, event, d) {
    d.x = event.x;  
    d.y = event.y;  

    GlobalState.simulation.start();
}  

function dragended(GlobalState, event, d) {
  delete d.dragOrigin;

  GlobalState.simulation.start();  
}

export {
     dragstarted,
     dragged,
     dragended,

}