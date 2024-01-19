function replaceNodeIds(data) {
  console.log(`type of data in replaceNodeIds:  ${typeof(data)}`);
  console.log(`data in replaceNodeIds:  ${CircularJSON.stringify(data)}`);

  const nodesMap = {};
  data.nodes.forEach(node => {
  	console.log(`node.id = ${node.id} typeof(node.id) = ${typeof(node.id)}   node.index = ${node.index} typeof(node.index) = ${typeof(node.index)}`);
  	const indexString = (node.index).toString();
  	const vars = indexString.replace (/^/,'~nodes~');
  	console.log(`vars: ${vars}  typeof(vars): ${typeof(vars)}   indexString: ${indexString}  typeof(indexString): ${typeof(indexString)}`);

    nodesMap[vars] = node.id;
  });

  console.log(`nodesMap: ${CircularJSON.stringify(nodesMap)}`);

  data.links.forEach(link => {
  	console.log(`link.source: ${link.source}   nodesMap[link.source]: ${nodesMap[link.source]}`);
    link.source = nodesMap[link.source];
    link.target = nodesMap[link.target];
  });

  return data;
}

async function fetchData(GlobalState) {  

	GlobalState.data = null;

	try {
		const response = await fetch(GlobalState.selectedFile);

		var jsonData = null
		if (response.ok) {
			jsonData = await response.json();
		} else if (response.status === 404) {
			console.log(`This graph doesn't exist.`);
			alert(`This graph doesn't exist.`);
			return;
		} else {
			throw new Error(`Network response was not ok`);
		}

		var updatedJsonData = '';

		if ("variable" in jsonData.nodes[0]){
				updatedJsonData = replaceNodeIds(jsonData);
		}else{
			updatedJsonData = jsonData;
		}

		GlobalState.data = updatedJsonData;

		console.log(`*** GlobalState.data: ${GlobalState.data}`);

	} catch (error) {
		console.error('There was a problem with the fetch operation:', error);
	}
}


async function loadOptions(GlobalState) {
	const response = await fetch("./available-graphs.json");
	const data = await response.json();
	GlobalState.availableGraphs = data;
	GlobalState.options = {
		'fav-fairytales': new Set(),
		'fav-starts': new Set(),
		'fav-endings': new Set(),
		'fav-storylines': new Set(),
		'fav-grounded-on': new Set(),
	}
	data.forEach((graph) => {
		const g = graph.split('-');
		GlobalState.options['fav-fairytales'].add(g[0])
		GlobalState.options['fav-starts'].add(g[1])
		GlobalState.options['fav-endings'].add(g[2])
		GlobalState.options['fav-storylines'].add(g[3])
		GlobalState.options['fav-grounded-on'].add(g[4])
	});

	Object.keys(GlobalState.options).map(key => {
		const select = document.getElementById(key)
		GlobalState.options[key].forEach((choice) => {
			const option = document.createElement('option');
			if (GlobalState.mappings.hasOwnProperty(choice)) {
				option.text = GlobalState.mappings[choice];
			} else {
				option.text = choice;
			}
			option.ClassName = "option";
			select.add(option);
		});
	})
}


function getPrompt(taskPrompt, text){
	if (taskPrompt === 'taskSummarizePath'){
		return(`Summarize the following list of beats: \n\n${text}\n\n. 
			Summarization must be self contained. 
			If beat is not summarized, simply return ''. 
			Summary: `);
	}
	else if (taskPrompt === 'taskSummarizeNode'){
		return (`Summarize the following action in a short phrase of at most 4 words: ${text}. 
			Summarization must be self contained. If action is not summarized, simply return ''. 
			Summary: `);
	}
	else if (taskPrompt === 'taskSummarizeNodesAtOnce'){
		return(`'INSTRUCTION: Summarize every beat in every row of : ${text} as a short phrase of at most four words. 
			Guideline 1: If beat is null, then output "" .
			Guideline 2: Use a breakline '\n' as a separator between output summarizations.
			Guideline 3: Don't itemize nor number the output summarized beat like "1. or 2. and so on".`);
	}
	else if (taskPrompt === 'taskCreatePathStoryline'){
		return(`INSTRUCTION: Given a list of Three Selected Beats and a list of Existing Beats as input here: \n\n${text}\n\n
		    Guideline 1: Create a new storyline starting at the first selected beat, passing through the second selected beat and finishing at the third selected beat in the list of Selected Beats.
			Guideline 2: The new storyline is comprised of new intermediate beats in-between the aforementioned Selected Beats.
			Guideline 3: Trim this storyline to its extrema beats: the first selected beat and the third selected beat. Nothing before. Nothing beyond.			
			Guideline 4: Create as many new intermediate beats as necessary to make the new storyline coherent while blending the three given beats.
			Guideline 5: Keep the order of selected beats in the new storyline. Never scrumble the order of these three beats.
			Guideline 6: The created intermediate beats ids must start being numbered where the ones in the given Existing Beats list end, without overlapping.
			Guideline 7: All three Selected Beats must appear as-is in the new storyline. Don't change their IDs.
			Guideline 8: In terms of semantic, each beat must correspond to one and only node in the new storyline.
			Guideline 9: Don't return descriptions, comments, titles, subtitles or remarks. Return simply the sequence of beats of this new storyline.
			`);
	}
	else if (taskPrompt === 'taskPathStoryline2Graph'){
		return (`INSTRUCTION: As an example, consider the Story comprised of the Introduction, Storyline 1 and Ending 1 right below
	
	Introduction:
	Once upon a time in a land far, far away, there lived a beautiful young princess named Snow White. She was the fairest of them all, with skin as white as snow, lips as red as blood, and hair as black as ebony. Her wicked stepmother, the Queen, grew envious of Snow White's beauty and ordered her to be killed in various ways. But Snow White, being clever and resourceful, managed to escape every time.

	Storyline 1 - Poisoned Comb:
	The Queen ordered Snow White's death by giving her a beautiful, enchanted comb, which was poisoned. When Snow White put the comb in her hair, she immediately felt dizzy and fell to the floor. Luckily, she managed to pull the comb from her hair and threw it away just in time. The comb shattered upon hitting the ground, and Snow White survived the ordeal.

	Ending 1 - The Prince's Kiss:
	Eventually, Snow White came across a small cottage in the woods, where she found seven dwarfs living together. They took her in and protected her from the Queen. One day, a charming prince stumbled upon the cottage and instantly fell in love with Snow White. They shared a magical kiss, breaking any remaining curse, and they lived happily ever after.

	INSTRUCTION:
	Now, consider the convention in the following objects nodes and edges of a network representing Storyline 1 and Ending 1.  


	These objects are meant as input data to a Javascript D3JS browser application for visualization.

	{
	    "nodes":
	    [
	        {
	            "id": "Beat_1",
	            "beat": "The story starts with the Queen, who is jealous of Snow White's beauty, ordering her death ",
	            "pathway": "1",
	            "summary": "Queen orders Snow White's death",
	        },
	        {
	            "id": "Beat_2",
	            "beat": "Queen orders the Huntsman to kill Snow White ",
	            "pathway": "6",
	            "summary": " Huntsman told to kill",
	        },
	                {
	            "id": "Beat_3",
	            "beat": "Queen orders the Woodcutter to kill Snow White ",
	            "pathway": "1",
	            "summary": " Woodcutter told to kill",
	        }, 
	    }


	    {"links":
	    [
	        {
	            "source": "~nodes~34",
	            "target": "~nodes~0",
	            "type": "out",
	        },
	        {
	            "source": "~nodes~26",
	            "target": "~nodes~35",
	            "type": "in",
	        },
	        {
	            "source": "~nodes~27",
	            "target": "~nodes~36",
	            "type": "in",
	        },

	  }


	Notice that the number of nodes for the links object may be obtained through the function:

	function getNodeIndex(GlobalState, id) {
	    for (var i = 0; i < GlobalState.data.nodes.length; i++) {
	        if (id == GlobalState.data.nodes[i].id) return i;
	    }
	}


	INSTRUCTION: Follow the next instructions for 

Following the aforementioned NODES convention, extract nodes objects for the actions in the Missions Boards given in:  ${text}.  

	Then create corresponding edges objects to represent the links between actions, according to every storyline

	First node should be considered as a start and end node should be considered as an ending.  

	Figure out intermediate nodes between START and ENDINGS according to every storyline.

	Make sure to create the last label number in every node that corresponds to the pathline it belongs to.

	Pathline labels starts from "1" and increases at step 1.

	A pathline corresponds to a unique path in the graph representing a storyline.

	At every bifurcation a branch remains with previous pathline label, while other branches will receive new pathline labels.

	The output must be only the nodes and links objects, nothing else

			Guideline 4: Refer to the provided Game option to keep the new storyline grounded on it
			Guideline 5: Refer to the network structure in order to not create same named nodes as the existing ones.
			Guideline 6: Notice the meaning of elements in the nodes representation: {node_id: [[game_state, nr_beat, beat, pathway]]}, where:
                node_id is a string with the label "Beat_" and a number to identify a node, game_state is the game state, nr_beat is the number of the respective beat, beat is a string describing some beat, 
                pathway is a string with an integer label to identify the path in the graph corresponding to a quest or storyline.
      
      Guideline 8: In terms of semantic, each node must correspond to one and only beat.
      Guideline 9: Make sure to create a node for every beat. No beat should be left without a node.
      Guideline 10: Don't create nodes semantically equal. Each node has a unique and distinct beat associated to it in terms of semantic.            
			Guideline 11: Each node must be connected to nodes according to the sequences provided from the storylines in the input.
			Guideline 12: Disconnected nodes are prohibited. Every node must be connected to the graph.
			Guideline 13: Make sure that every node in the NODES object also appears in the EDGES object and vice-versa.
      Guideline 14: color the nodes pertaining to a same storyline with the very same color, that is, assigning a same integer value starting from 1 to the correspoding pathline property of the node.

	`);	
	} else if (taskPrompt === 'taskGenerateStoriesArcDraft'){
			return (`INSTRUCTION: Your task is to generate unique and interesting storylines given the following INPUT OPTIONS: ${text}
			Follow the format in the example below, without duplicating its content.
			
			Story: (name of the story),
			Starts: (number of starts here),
			Endings: (number of endings here),
			Storylines: (number of storylines here),
			Setting: (topic on which storylines must be grounded)
			
			Storylines (detailed with beat descriptions):
			Storyline 1: (Line separated sequence of beats. Include a detailed description of each beat and assign it a beat number.)
			Storyline 2: (Line separated sequence of beats that have some beats common with the previous storyline(s) and some new beats. Include a detailed description of each beat. If the beat is common to one of the previous storylines, then its description and number should be exactly the same as in the previous one as well, but repeat the detailed beat description for clarity. Assign new beat numbers to the new beats.)         
			…
			Storyline 10: (Line separated sequence of beats that have some beats common with the previous storyline(s) and some new beats. Include a detailed description of each beat. If the beat is common to one of the previous storylines, then its description and number should be exactly the same as in the previous one as well, but repeat the detailed beat description for clarity. Assign new beat numbers to the new beats)
			
			(List as many dummy start nodes as number of starts in INPUT OPTIONS)
			START_1: (This is a dummy node. No description for it. It will always point to the beginning beat of the respective storyline) 
			START_2: (This is a dummy node. No description for it. It will always point to the beginning beat of the respective storyline)
			… 
			
			(List as many dummy end nodes as number of starts in INPUT OPTIONS)
			END_1: (This is a dummy node. No description for it. The final beat of the respective storyline will point to it)
			END_2: (This is a dummy node. No description for it. The final beat of the respective storyline will point to it)
			…
			
			Beats (include the list of all the unique beats from the storylines above. Include the exact same description and exact same beat number)
			Beat_1: (beat description)
			Beat_2: (beat description)
						…  
			Beat_n: (beat description)
			
			Common intermediate Beats: (beats numbers that are common to ALL the storylines)
			
			Storylines (with only beat numbers)
			Storyline 1: (a dummy START node, comma-separated exact sequence of beat numbers of this storyline, a dummy END node)
			Storyline 2: (a dummy START node, comma-separated exact sequence of beat numbers of this storyline, a dummy END node)
			…
			Storyline 10: (a dummy START node, comma-separated exact sequence of beat numbers of this storyline, a dummy END node)
			
			YOU MUST STRICTLY FOLLOW THESE CONSTRAINTS
			1.	Each storyline must consist of a sequence of narrative beats. Different storylines must have different sequence of beats. The common subsequence between two storylines cannot be greater than three.
			2.	THE TOTAL NUMBER OF BEATS MUST BE ATLEAST TWICE THE NUMBER OF STORYLINES. Describe each beat in detail.
			3.	Make sure that the original story appears as one of the resulting storylines.  
			4.	Ground the storylines in the setting focusing on characteristics of the setting that are unique and help make the storylines interesting and novel. Those characteristics might include cultural elements like foods or clothing or music, strange physical properties, unique flora and fauna, unusual geographical features, and surprising technology.
			5.	There must be only as many unique starts as given in the INPUT OPTIONS, with each start pointing to a different beat.
			6.	There must be only as many unique endings as given in the INPUT OPTIONS, with each ending being pointed to by a different beat.
			7.	THERE MUST BE 2 OR 3 BEATS THAT ARE COMMON IN ALL THE STORYLINES. These must be the important narrative beats in the story. The common beats must not be consecutive.  
			IMPORTANT: As you are writing each storyline, think if the sequence of beats make sense to be a coherent storyline. Each storyline should follow the conventions of fairytale narratives of conflicts or dangers and clear resolutions. There should be no loose ends. Each storyline should be a unique sequence of beats that is different from other storylines. 
			
			Below is an example output:
			
			Story: Little Red Riding Hood
			Starts: 2
			Endings: 4
			Storylines: 8
			Setting: 21st century

			Storylines (8):

			Storyline 1:
			Beat 1: Red, a tech-savvy girl living in a smart city, receives a call from her sick grandmother.
			Beat 2: Grandmother requests Red to bring her some medicines from the nearby pharmacy.
			Beat 3: Red, wearing her red hoodie, ventures out with her electric scooter.
			Beat 4: En route, Red encounters a stranger, a cunning hacker, who learns about her mission.
			Beat 5: The hacker manipulates the city's GPS system to mislead Red.
			Beat 6: Misled, Red ends up in an abandoned factory.
			Beat 7: Realizing the trick, Red uses her tech skills to trace the hacker's location.
			Beat 8: Red exposes the hacker to the city's cyber police and continues her journey to her grandmother's house.
			Beat 9: Red delivers the medicines and they have a virtual family gathering via video call.

			Storyline 2:
			Beat 1: Red, a tech-savvy girl living in a smart city, receives a call from her sick grandmother.
			Beat 10: Grandmother asks Red to bring her a special gadget from the tech mall.
			Beat 3: Red, wearing her red hoodie, ventures out with her electric scooter.
			Beat 4: En route, Red encounters a stranger, a cunning hacker, who learns about her mission.
			Beat 11: The hacker hacks into Red's smartwatch, stealing her personal data.
			Beat 12: Red notices suspicious activity on her smartwatch and seeks help from her friend, a cybersecurity expert.
			Beat 13: Together, they trace the hacker and retrieve Red's data.
			Beat 14: Red buys the gadget and delivers it to her grandmother.

			Storyline 3:
			Beat 15: Red, a social media influencer, plans a live stream to visit her grandmother.
			Beat 2: Grandmother requests Red to bring her some medicines from the nearby pharmacy.
			Beat 3: Red, wearing her red hoodie, ventures out with her electric scooter.
			Beat 16: Red's live stream attracts the attention of a cyber-stalker.
			Beat 17: The stalker tries to find Red's location using the live stream data.
			Beat 7: Realizing the threat, Red uses her tech skills to trace the stalker's location.
			Beat 8: Red exposes the stalker to the city's cyber police and continues her journey to her grandmother's house.
			Beat 9: Red delivers the medicines and they have a virtual family gathering via video call.

			Storyline 4:
			Beat 15: Red, a social media influencer, plans a live stream to visit her grandmother.
			Beat 10: Grandmother asks Red to bring her a special gadget from the tech mall.
			Beat 3: Red, wearing her red hoodie, ventures out with her electric scooter.
			Beat 16: Red's live stream attracts the attention of a cyber-stalker.
			Beat 18: The stalker tries to manipulate Red's followers against her.
			Beat 19: Red, noticing the unusual comments, uses her influence to expose the stalker's intentions.
			Beat 20: Red's followers, united, report the stalker leading to his arrest.
			Beat 14: Red buys the gadget and delivers it to her grandmother.

			Storyline 5:
			Beat 1: Red, a tech-savvy girl living in a smart city, receives a call from her sick grandmother.
			Beat 21: Grandmother asks Red to download and install a specific software on her computer.
			Beat 3: Red, wearing her red hoodie, ventures out with her electric scooter.
			Beat 4: En route, Red encounters a stranger, a cunning hacker, who learns about her mission.
			Beat 22: The hacker sends Red a malicious software disguised as the one requested by her grandmother.
			Beat 23: Red, noticing the odd behavior of the software, realizes the trick.
			Beat 24: Red, with the help of her tech community, removes the malicious software and exposes the hacker.
			Beat 25: Red installs the correct software on her grandmother's computer.

			Storyline 6:
			Beat 1: Red, a tech-savvy girl living in a smart city, receives a call from her sick grandmother.
			Beat 26: Grandmother asks Red to bring her some digital books from the e-library.
			Beat 3: Red, wearing her red hoodie, ventures out with her electric scooter.
			Beat 4: En route, Red encounters a stranger, a cunning hacker, who learns about her mission.
			Beat 27: The hacker tries to gain access to Red's e-library account.
			Beat 28: Red, noticing the login attempts, secures her account and reports the hacker.
			Beat 29: Red downloads the digital books and delivers them to her grandmother.

			Storyline 7:
			Beat 15: Red, a social media influencer, plans a live stream to visit her grandmother.
			Beat 21: Grandmother asks Red to download and install a specific software on her computer.
			Beat 3: Red, wearing her red hoodie, ventures out with her electric scooter.
			Beat 16: Red's live stream attracts the attention of a cyber-stalker.
			Beat 30: The stalker sends Red a dangerous link pretending to be a fan.
			Beat 31: Red, being tech-savvy, recognizes the dangerous link and alerts her followers.
			Beat 32: Red's followers report the stalker leading to his arrest.
			Beat 25: Red installs the correct software on her grandmother's computer.

			Storyline 8:
			Beat 15: Red, a social media influencer, plans a live stream to visit her grandmother.
			Beat 26: Grandmother asks Red to bring her some digital books from the e-library.
			Beat 3: Red, wearing her red hoodie, ventures out with her electric scooter.
			Beat 16: Red's live stream attracts the attention of a cyber-stalker.
			Beat 33: The stalker tries to disrupt Red's live stream by spreading false rumors.
			Beat 34: Red, noticing the disruption, uses her influence to debunk the rumors.
			Beat 35: Red's followers, united, report the stalker leading to his arrest.
			Beat 29: Red downloads the digital books and delivers them to her grandmother.

			START_1: Points to Beat 1
			START_2: Points to Beat 15

			END_1: Points from Beat 9
			END_2: Points from Beat 14
			END_3: Points from Beat 25
			END_4: Points from Beat 29

			Beats:
			Beat 1: Red, a tech-savvy girl living in a smart city, receives a call from her sick grandmother.
			Beat 2: Grandmother requests Red to bring her some medicines from the nearby pharmacy.
			Beat 3: Red, wearing her red hoodie, ventures out with her electric scooter.
			Beat 4: En route, Red encounters a stranger, a cunning hacker, who learns about her mission.
			Beat 5: The hacker manipulates the city's GPS system to mislead Red.
			Beat 6: Misled, Red ends up in an abandoned factory.
			Beat 7: Realizing the trick, Red uses her tech skills to trace the hacker's location.
			Beat 8: Red exposes the hacker to the city's cyber police and continues her journey to her grandmother's house.
			Beat 9: Red delivers the medicines and they have a virtual family gathering via video call.
			Beat 10: Grandmother asks Red to bring her a special gadget from the tech mall.
			Beat 11: The hacker hacks into Red's smartwatch, stealing her personal data.
			Beat 12: Red notices suspicious activity on her smartwatch and seeks help from her friend, a cybersecurity expert.
			Beat 13: Together, they trace the hacker and retrieve Red's data.
			Beat 14: Red buys the gadget and delivers it to her grandmother.
			Beat 15: Red, a social media influencer, plans a live stream to visit her grandmother.
			Beat 16: Red's live stream attracts the attention of a cyber-stalker.
			Beat 17: The stalker tries to find Red's location using the live stream data.
			Beat 18: The stalker tries to manipulate Red's followers against her.
			Beat 19: Red, noticing the unusual comments, uses her influence to expose the stalker's intentions.
			Beat 20: Red's followers, united, report the stalker leading to his arrest.
			Beat 21: Grandmother asks Red to download and install a specific software on her computer.
			Beat 22: The hacker sends Red a malicious software disguised as the one requested by her grandmother.
			Beat 23: Red, noticing the odd behavior of the software, realizes the trick.
			Beat 24: Red, with the help of her tech community, removes the malicious software and exposes the hacker.
			Beat 25: Red installs the correct software on her grandmother's computer.
			Beat 26: Grandmother asks Red to bring her some digital books from the e-library.
			Beat 27: The hacker tries to gain access to Red's e-library account.
			Beat 28: Red, noticing the login attempts, secures her account and reports the hacker.
			Beat 29: Red downloads the digital books and delivers them to her grandmother.
			Beat 30: The stalker sends Red a dangerous link pretending to be a fan.
			Beat 31: Red, being tech-savvy, recognizes the dangerous link and alerts her followers.
			Beat 32: Red's followers report the stalker leading to his arrest.
			Beat 33: The stalker tries to disrupt Red's live stream by spreading false rumors.
			Beat 34: Red, noticing the disruption, uses her influence to debunk the rumors.
			Beat 35: Red's followers, united, report the stalker leading to his arrest.

			Common intermediate Beats: Beat 3, Beat 4, Beat 16

			Storylines (8)
			Storyline 1: START_1, 1, 2, 3, 4, 5, 6, 7, 8, 9, END_1
			Storyline 2: START_1, 1, 10, 3, 4, 11, 12, 13, 14, END_2
			Storyline 3: START_2, 15, 2, 3, 16, 17, 7, 8, 9, END_1
			Storyline 4: START_2, 15, 10, 3, 16, 18, 19, 20, 14, END_2
			Storyline 5: START_1, 1, 21, 3, 4, 22, 23, 24, 25, END_3
			Storyline 6: START_1, 1, 26, 3, 4, 27, 28, 29, END_4
			Storyline 7: START_2, 15, 21, 3, 16, 30, 31, 32, 25, END_3
			Storyline 8: START_2, 15, 26, 3, 16, 33, 34, 35, 29, END_4

			`);

	}	else if (taskPrompt === 'taskGenerateFairytalesNetworkStructure'){
		return(`INSTRUCTION: Given this narrative game draft ${text}, your task is to structure this input as nodes and edges objects striclty following the format described below.

			      Guideline 1: For example, take a story draft structured as follows:    

						Tales: Little Red Riding Hood,
						Starts: 1,
						Endings: 1,
						Storylines: 8,
						GroundedOn: Minecraft

						START_1: (This is a dumb node. No description for it. It will always point to the beginning beat of the respective storyline)

						END_1: (This is a dumb node. No description for it. The final node of the respective storyline will point to it.)

						Beats:
						- Beat_1: Little Red Riding Hood, a Minecraft character, is given a task by her mother to deliver a basket of food to her grandmother's house.
						- Beat_2: Little Red Riding Hood ventures through a dense forest biome, collecting materials for her journey.
						- Beat_3: She encounters a friendly Minecraft villager who warns her about the dangerous wolves in the forest.
						- Beat_4: Little Red Riding Hood is distracted by a beautiful flower biome and strays off the path.
						- Beat_5: She encounters a wolf (a Minecraft mob), who tricks her into revealing her grandmother's location.
						- Beat_6: The wolf races ahead and locks her grandmother in a Minecraft dungeon.
						- Beat_7: Little Red Riding Hood arrives at her grandmother's house and realizes something is wrong.
						- Beat_8: She bravely confronts the wolf and rescues her grandmother by using her Minecraft tools.

						Common intermediate beats: Beat_3, Beat_5

						Storylines (8):
						- Storyline 1: START_1, Beat_1, Beat_2, Beat_3, Beat_5, Beat_7, Beat_8, END_1
						- Storyline 2: START_1, Beat_1, Beat_2, Beat_3, Beat_4, Beat_5, Beat_8, END_1
						- Storyline 3: START_1, Beat_1, Beat_2, Beat_3, Beat_5, Beat_6, Beat_7, Beat_8, END_1
						- Storyline 4: START_1, Beat_1, Beat_2, Beat_4, Beat_3, Beat_5, Beat_7, Beat_8, END_1
						- Storyline 5: START_1, Beat_1, Beat_3, Beat_2, Beat_4, Beat_5, Beat_8, END_1
						- Storyline 6: START_1, Beat_1, Beat_3, Beat_2, Beat_5, Beat_6, Beat_7, Beat_8, END_1
						- Storyline 7: START_1, Beat_1, Beat_3, Beat_2, Beat_5, Beat_7, Beat_8, END_1
						- Storyline 8: START_1, Beat_1, Beat_3, Beat_5, Beat_2, Beat_4, Beat_7, Beat_8, END_1


						Guideline 2: Now, consider the next convention for nodes and edges objects from a network representing the given storylines. 

                These objects are meant as input data to a Javascript D3JS browser application for visualization. Bear in mind START and END nodes are always in the end of each object.



								NODES:{"Beat_1": [["None", 1, "Little Red Riding Hood, a Minecraft character, is given a task by her mother to deliver a basket of food to her grandmother's house.", "1"]],"Beat_2": [["None", 2, "Little Red Riding Hood ventures through a dense forest biome, collecting materials for her journey.", "1"]],
								"Beat_3": [["None", 3, "She encounters a friendly Minecraft villager who warns her about the dangerous wolves in the forest.", "1"]],
								"Beat_4": [["None", 4, "Little Red Riding Hood is distracted by a beautiful flower biome and strays off the path.", "1"]],
								"Beat_5": [["None", 5, "She encounters a wolf (a Minecraft mob), who tricks her into revealing her grandmother's location.", "1"]],
								"Beat_6": [["None", 6, "The wolf races ahead and locks her grandmother in a Minecraft dungeon.", "1"]],
								"Beat_7": [["None", 7, "Little Red Riding Hood arrives at her grandmother's house and realizes something is wrong.", "1"]],
								"Beat_8": [["None", 8, "She bravely confronts the wolf and rescues her grandmother by using her Minecraft tools.", "1"]],

								"START_1": [["None", null, null, null]],
								"END_1": [["None", null, null, null]]
								}

								EDGES:

								{ 
								"Beat_1": {"None": [[["START_1", "Beat_1"]], [["Beat_1", "Beat_2"], ["Beat_1", "Beat_3"]]]}, 
								"Beat_2": {"None": [[["Beat_1", "Beat_2"]], [["Beat_2", "Beat_3"], ["Beat_2", "Beat_4"]]]},
								"Beat_3": {"None": [[["Beat_1", "Beat_3"],["Beat_2", "Beat_3"]], [["Beat_3", "Beat_4"], ["Beat_3", "Beat_5"]]]}, 
								"Beat_4": {"None": [[["Beat_2", "Beat_4"], ["Beat_3", "Beat_4"]], [["Beat_4", "Beat_5"]]]},  
								"Beat_5": {"None": [[["Beat_3", "Beat_5"], ["Beat_4", "Beat_5"]], [["Beat_5", "Beat_6"], ["Beat_5", "Beat_7"]]]}, 
								"Beat_6": {"None": [[["Beat_5", "Beat_6"]], [["Beat_6", "Beat_7"]]]},
								"Beat_7": {"None": [[["Beat_5", "Beat_7"], ["Beat_6", "Beat_7"]], [["Beat_7", "Beat_8"]]]},  
								"Beat_8": {"None": [[["Beat_7", "Beat_8"]], [["Beat_8", "END_1"]]]},

								"START_1": {"None": [[], [["START_1", "Beat_1"]]]},
								"END_1": {"None": [[["Beat_8", "END_1"]],[]]}
								}


						More guidelines:

						3.  Notice the meaning of elements in the nodes representation: {node_id: [[game_state, nr_beat, beat, pathway]]}, where:
                node_id is a string with the label "Beat_" and a number to identify a node, game_state is the game state, nr_beat is the number of the respective beat, beat is a string describing respective beat, 
                pathway is a string with an integer label to identify the path in the graph corresponding to a quest or storyline.
            4. 	Each node must correspond to one and only one beat, so that the number of nodes and beats are the same in the end.
            5. Make sure to create a node for every beat. No beat should be left without a node.
            6. Don't create nodes semantically equal. Each node has a unique and distinct beat associated to it in terms of semantic.            
						7. For every beginning beat, create an associated dumb START node (e.g. START_1, START_2, ...) and connect the latter to the former.
						8. For every ending beat, create an associated dumb END node (e.g. END_1, END_2, ...) and connect the former to the latter.
						10. Make sure to create an edge between each pair of adjacent nodes in the given sequences for the storylines. Make sure you don't miss out any edge.
						11. Every node must be connected to the graph.
						12. START nodes must be at the end of the NODES and EDGES objects. START nodes are prohibited in the beginning of any objects. NEVER EVER put START and END nodes in the beginnig of any object.
						13. END nodes must be at the end of the NODES and EDGES objects. END nodes are prohibited in the beginning of any object. NEVER EVER put START and END nodes in the beginnig of any object.
						14. Make sure that every node in the NODES object also appears in the EDGES object and vice-versa.
            15. Color the nodes pertaining to a same storyline with the very same color, that is, assigning a same integer value starting from 1 to the correspoding pathline property of the node.`);

	} else {
  	console.log('no prompt for this task');
  }
}

export {
	fetchData,
	getPrompt,
	loadOptions,
}