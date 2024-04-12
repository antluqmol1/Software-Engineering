import React from "react";

const AboutTheApp = () => {
  const nightOutChallenges = [
    (individual_challenges = [
      "Find someone with the same name as a member of your group and take a selfie.",
      "Form a conga line with at least five strangers.",
      "Order the most exotic drink at the bar and share it with a new friend.",
      "Stage a dramatic fake proposal with someone in your group in a public area.",
      "Organize an impromptu dance-off in the middle of the dance floor.",
      "Sing a duet with a stranger at a karaoke bar.",
      "Get a temporary tattoo from a vending machine and apply it on your face.",
      "Convince the DJ to let you announce the next song.",
      "Exchange an item of clothing with a member of a different group.",
      "Create a signature group dance move and perform it whenever a certain song plays.",
      "Find someone to serenade the group.",
      "Take a selfie with a street performer.",
      "Create a handshake with a stranger with at least 5 steps.",
      "Poses with sensual face in the background of a stranger's photo.",
      "Find someone with the same name as a group member and give him or her a kiss in the cheek.",
      "Impersonate a celebrity until someone guesses who it is.",
      "Exchange an accessory with a stranger.",
      "Order the group's drinks in rhymes.",
      "Convince a stranger to tell their funniest joke to the group.",
      "Compare a stranger with a celebrity you find similar and ask for an autograph until you get it.",
      "Perform a flash mob dance at a public place.",
      "Start a compliment chain with strangers, each person has to compliment someone new.",
      "Find a couple who has been together for more than 10 years and ask for relationship advice.",
      "Do a dramatic reading of a random text message from your phone.",
      "Organize a limbo contest with a stranger as the judge.",
      "Order a drink using a made-up language and see if they can get served.",
      "Find and take a picture with the city's 'hidden gem' spot as recommended by a local",
    ]),
    (group_challenges = [
      "As a group, do a conga line through a public square.",
      "Choose a group's favorite song and Get a bar or pub to play that song and sing along loudly.",
      "Take a group selfie with a local monument as if it's part of the crew.",
      "Everyone must tell a different bartender the same made-up fairy tale as if it were true.",
      "Find a karaoke bar and sing a group rendition of a classic hit.",
      "Create a group poem where each person contributes one line, then recite it to a stranger.",
      "Together, make up a dance on the spot and perform it in public.",
      "Have the entire group pose as mannequins in a store window.",
      "Play a group game of 'I Spy' on public transport.",
      "Everyone swap an item of clothing with someone else in the group and wear it for the next hour.",
      "As a team, come up with a superhero name and backstory for each group member.",
    ]),
  ];
  const familyFriendlyChallenges = [
    (individual_challenges = [
      "Build the tallest tower using items in the room.",
      "Create a family crest with paper and markers.",
      "Have a dessert-making challenge where everyone decorates their own cupcakes.",
      "Set up a silly walk contest and have a prize for the most unique stride.",
      "Host a paper airplane contest and see whose can fly the furthest.",
      "Set up a mini indoor treasure hunt.",
      "Do a puzzle race with small jigsaw puzzles.",
      "Create a mini play where each family member gets to play a character.",
      "Perform a puppet show using socks and improvised storylines.",
      "Have a themed costume contest where each person has 15 minutes to prepare their outfit.",
    ]),
    (group_challenges = [
      "Set up a mini-golf course using household items and determine the family champion.",
      "Create a family handprint mural using washable paints.",
      "Organize a scavenger hunt with riddles leading to different places in the house.",
      "Do a group painting where each person adds to the canvas every five minutes.",
      "Have a family talent show with household items as props.",
      "Organize a costume parade using only bed sheets and pillows.",
      "Hold a storytelling competition with each person adding a sentence.",
      "Do a family yoga session following an online class.",
      "Make a family band using homemade instruments.",
      "Play charades with movies and books everyone knows.",
      "Have a dessert-making competition where the youngest family member is the judge.",
      "Build a fort out of pillows and blankets and take a group photo inside.",
      "Create a family band where everyone plays an 'instrument' (real or homemade) and perform a song.",
      "Build a blanket fort and everyone must contribute a part of the construction.",
      "Have a themed costume dinner where everyone dresses up and stays in character.",
      "Organize a group storytelling where each person adds a sentence to build a story.",
      "Have a drawing contest where everyone collaborates on a giant piece of paper.",
      "Play a family-wide game of 'Follow the Leader' with silly actions.",
      "Host a family bake-off where everyone helps make a part of the same dish.",
      "Create a family mural with sidewalk chalk.",
      "Together, write and act out a commercial for a silly or imaginary product.",
      "Set up a relay race with stations for different goofy tasks.",
    ]),
  ];
  const mountainHikeChallenges = [
    (individual_challenges = [
      "Identify five different types of plants and take a photo with each.",
      "Identify and take pictures of three different types of plants.",
      "Build a small cairn at a designated spot.",
      "Find and purify water from a natural source.",
      "Ask someone to take you a picture from the highest point of the hike where you appear showing your ass.",
      "Share an inspiring quote with the group and discuss it.",
      "Create nature art using only found items from the ground.",
      "Spot and identify a bird of prey in the sky.",
      "Lead the hike for 10 minutes, choosing an unusual walking style.",
      "Create a nature scavenger hunt with a list of items to find along the trail.",
      "Hold a stone-skipping contest if you pass by a lake or pond.",
      "Organize a 'hike and seek' where one person hides off-trail nearby and the rest seek.",
      "Create a haiku poem inspired by the hike and share it at the end.",
      "Do your best Tarzan yell from a scenic overlook.",
      "Find the largest leaf you can and wear it as a hat until the next checkpoint.",
      "Have a two-minute freeze-frame moment pretending you’re a statue wherever you are.",
      "Invent a secret handshake with an inanimate object like a tree or a rock.",
      "Give a tree a name and a backstory and introduce it to the group.",
      "Convince someone that a rock you found is an ancient artifact.",
      "Do an interpretive dance that tells the story of how the mountain was formed.",
      "Strike a dramatic pose on a boulder and recite a few lines from a favorite song as if it’s a Shakespearean monologue.",
      "Pretend to be a nature documentary narrator until the next rest stop.",
      "Imitate a famous influencer or celebrity's social media post in the wild.",
      "Balance a stack of three stones on your head while walking for 10 feet.",
      "Wear socks on your hands for 15 minutes while hiking.",
      "Take a whimsical selfie while jumping in the air with an epic backdrop.",
      "Swap a piece of gear with a fellow hiker and wear it until you reach the summit.",
      "Find a natural echo and shout out the funniest word you can think of.",
      "Challenge someone to rock-paper-scissors, and the loser has to carry the winner's backpack for 5 minutes.",
      "Attempt to start a howl that the whole valley can hear.",
      "Skip instead of walk for 2 minutes.",
      "Try to make friends with a squirrel or bird you encounter.",
    ]),
    (group_challenges = [
      "Stop and have a mini meditation session with the sounds of nature.",
      "Initiate a trail clean-up challenge; see who can pick up the most litter.",
      "Have a silent hike for 15 minutes, communicating only with hand signals.",
      "Take a group selfie where everyone has to jump at the same time.",
      "Mimic animal calls and guess the animal.",
      "Sing a hiking song together while walking.",
      "Do a group howl like wolves on a mountaintop.",
      "Have a race to the next trail marker.",
      "Have a 'silent hike' challenge where no one speaks for 10 minutes, only enjoying nature’s sounds.",
      "Choose an easy-to-sing song and as a group, serenade the wilderness.",
      "Have everyone collect a unique natural item and then share a made-up story about it.",
      "Play a trail-version of 'Simon Says' with nature-inspired actions.",
      "Organize a synchronized dance on the peak of the hike.",
      "As a group, create a land art piece without disturbing the natural habitat.",
      "Host a nature photography contest where everyone snaps a pic from the same spot.",
      "Lead a trail sing-along with nature-themed songs.",
      "Together, form the letters of an inspirational word and take an aerial photo.",
      "Have everyone pick up a rock along the way and contribute to a group cairn.",
      "Start a group storytelling chain, each adding to the adventure narrative of the hike.",
    ]),
  ];
  return (
    <div>
      <h1>About The App</h1>
      <h2>Night Out Challenges</h2>
      <ul>
        {nightOutChallenges.map((challenge, index) => (
          <li key={`nightout-${index}`}>{challenge}</li>
        ))}
      </ul>
      <h2>Family Friendly Challenges</h2>
      <ul>
        {familyFriendlyChallenges.map((challenge, index) => (
          <li key={`family-${index}`}>{challenge}</li>
        ))}
      </ul>
      <h2>Mountain Hike Challenges</h2>
      <ul>
        {mountainHikeChallenges.map((challenge, index) => (
          <li key={`mountain-${index}`}>{challenge}</li>
        ))}
      </ul>
    </div>
  );
};
