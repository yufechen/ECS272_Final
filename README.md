# ECS272_Final

## How to run this code: 
- Clone the repository
- cd Vue-Template
- npm install
- npm run dev

## User Interactions
- Click the checkboxes to filter by that attribute, removing icons that do not fit the criteria (Role and attack type)
  - Users can click multiple checkboxes to further specify their search
  - Uncheck the box to undo that specific filter
- Click the green "Toggle to Pick Rate" to change it to a graph for Win Rate vs Pick Rate
  - This turns the button red, where clicking the red "Toggle to Ban Rate" returns the graph to Win Rate vs Ban Rate
  - This also has an animation that moves the icons horizontally based on the difference from their ban rate to their pick rate
- Hover over an icon to see their name, win rate, pick rate, ban rate, attack type (melee/ranged), and roles
- Click an icon and scroll down to see the advanced metrics for that hero
- To see the map tracking functionality, uncomment the code under the designated section in App.vue and rerun the program
