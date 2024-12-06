<template>
    <div class="map-container">
        <!-- Dropdown Menu for Names -->
        <select v-model="selectedName">
            <option disabled value="">Select a player</option>
            <option v-for="(name, key) in names" :key="key" :value="name">
                {{ name }}
            </option>
        </select>

        <!-- Button to trigger animation -->
        <button @click="startAnimation">Start Animation</button>

        <!-- SVG Map -->
        <svg id="map-svg" width="500" height="500" ref="map">
        <!-- Dynamically draw paths and wards here -->
        </svg>
    </div>
</template>
  
<script lang="ts">
    import { useCurrentHero } from '../stores/store';
    import * as d3 from 'd3';

    export default {
    data() {
        const currentHero = useCurrentHero();

        return {
            names: {} as Record<number, string>,
            heroPositions: {} as Record<string, string>,
            obsPositions: {} as Record<string, string>,
            senPositions: {} as Record<string, string>,
            selectedName: '',
            currentHero,
        };
    },
    watch: {
    // Watch for changes to the currentHero.chosenState
    'currentHero.chosenState': {
            handler(newVal, oldVal) {
                console.log(`currentHero.chosenState changed from ${oldVal} to ${newVal}`);
                this.initMap();
            },
        },
    },
    mounted() {
        this.initMap();
    },
    methods: {
        loadData() {
            this.initMap();
        },
        initMap() {
            d3.select("#map-svg").selectAll("*").remove();
            const svg = d3.select("#map-svg")
                      .attr("width", 500)
                      .attr("height", 500);

            svg.append("image")
                .attr("width", 500)
                .attr("height", 500)
                .attr("x", 0)
                .attr("y", 0)
                .attr("href", '../../data/Images/map.webp');
            
            // update hero data
            d3.csv('../../data/newest_matches_per_hero_player.csv').then((data)=> {
                var filteredData = data.filter(d => d.hero_id === this.currentHero.chosenState.toString());
                var i = 0;
                filteredData.forEach((d: any) => {
                    this.names[i] = d.name;
                    i += 1;
                    this.heroPositions[d.name] = d.lane_pos;
                    this.obsPositions[d.name] = d.obs_log;
                    this.senPositions[d.name] = d.sen_log;
                });
            });
        },
        startAnimation() {
            this.initMap();
            var hero = '';
            var obs = '';
            var sen = '';

            console.log('obs:',this.obsPositions[this.selectedName]);
            console.log('sen:',this.senPositions[this.selectedName]);

            if(this.selectedName){
                hero = JSON.parse(this.heroPositions[this.selectedName].replace(/'/g, '"'));
                if(this.obsPositions[this.selectedName]) obs = JSON.parse(this.obsPositions[this.selectedName].replace(/'/g, '"'));
                if(this.senPositions[this.selectedName]) sen = JSON.parse(this.senPositions[this.selectedName].replace(/'/g, '"'));
            }else{
                alert('Please select a player before play animation.');
                return 0;
            }

            console.log('obs:',obs);
            console.log('sen:',sen);
            

            const svg = d3.select("#map-svg");
            const movements = [];
            Object.keys(hero).forEach(x => {
                Object.keys(hero[x]).forEach(y => {
                    movements.push({x: +x, y: +y, time: hero[x][y]});
                })
            })

            const circle = svg.append("circle")
                            .attr("r", 10)
                            .attr("fill", "red")
                            .attr("cx", movements[0].x)
                            .attr("cy", movements[0].y);

            let lineData = [{ x: movements[0].x, y: movements[0].y }];

            const line = d3.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; });


            function animateMovements(i = 0) {
                if (i >= movements.length) {
                    return 0;
                }

                if(obs) {
                    const item = obs.find(obj => obj.time == i);
                    if (item){
                        console.log('x',item.x)
                        console.log('y',item.y)
                        svg.append("circle")
                            .attr("r", 10)
                            .attr("fill", "yellow")
                            .attr("cx", item.x)
                            .attr("cy", item.y);
                    }
                }

                if(sen) {
                    const item = sen.find(obj => obj.time == i);
                    if (item){
                        svg.append("circle")
                            .attr("r", 10)
                            .attr("fill", "blue")
                            .attr("cx", item.x)
                            .attr("cy", item.y);
                    }
                }

                const move = movements[i];
                lineData.push(move);

                svg.append("path")
                    .datum(lineData)
                    .attr("fill", "red")
                    .attr("stroke", "red")
                    .attr("stroke-width", 1)
                    .attr("d", line);

                circle.transition()
                    .duration(move.time * 10)  // Convert time to milliseconds
                    .attr("cx", move.x)     // Scale factor for display
                    .attr("cy", move.y)
                    .on("end", () => animateMovements(i + 1));
            }
            animateMovements();
        },

    }
    }
</script>

<style>
.map-container {
    position: relative;
    padding: 20px;
}
.event-marker {
    position: absolute;
    transform: translate(-50%, -50%);
}
select {
    margin-bottom: 10px;
    width: 50%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}
</style>
  