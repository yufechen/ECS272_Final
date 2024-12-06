<template>
    <div class="radar-wrapper">
      <svg id="radar-svg"></svg>
    </div>

    <div v-if="tooltipVisible" class="tooltip" :style="tooltipStyle">
      <strong>{{ tooltipData.axis }}: {{ tooltipData.value }}</strong>
    </div>  
</template>
  
  <script lang="ts">
  import { useCurrentHero } from '../stores/store';
  import * as d3 from 'd3';
  
  export default {
    name: 'RadarChart',
    data() {
      const currentHero = useCurrentHero();
      return {
        tooltipVisible: false,
        tooltipData: { axis: '', value: ''},
        tooltipStyle: { left: '0px', top: '0px' },
        maxValue: {
          "gold_per_min": 774.1772151899,
          "xp_per_min": 874.5334040297,
          "hero_damage": 29089.5111111111,
          "tower_damage": 8615.8205361199,
          "damage_taken_parsed": 96700.7314814815,
          "kills": 10.7022222222,
          "deaths": 8.6119791667,
          "assists": 16.4641025641,
          "hero_healing": 14148.8741496599,
          "obs_sen_placed": 22.1860869565
        },
        currentHero,
      };
    },
    methods: {
        initRadar() {
            d3.select("#radar-svg").selectAll("*").remove();
            d3.csv("../../data/average_hero_radar.csv").then((data) => {
                const heroData = data.filter(d => d.hero_id === this.currentHero.chosenState.toString())[0];
                let radarData = [
                    {axis: "gold_per_min", value: parseFloat(heroData.gold_per_min), max: this.maxValue.gold_per_min},
                    {axis: "xp_per_min", value: parseFloat(heroData.xp_per_min), max: this.maxValue.xp_per_min},
                    {axis: "hero_damage", value: parseFloat(heroData.hero_damage), max: this.maxValue.hero_damage},
                    {axis: "tower_damage", value: parseFloat(heroData.tower_damage), max: this.maxValue.tower_damage},
                    {axis: "damage_taken", value: parseFloat(heroData.damage_taken_parsed), max: this.maxValue.damage_taken_parsed},
                    {axis: "kills", value: parseFloat(heroData.kills), max: this.maxValue.kills},
                    {axis: "deaths", value: parseFloat(heroData.deaths), max: this.maxValue.deaths},
                    {axis: "assists", value: parseFloat(heroData.assists), max: this.maxValue.assists},
                    {axis: "hero_healing", value: parseFloat(heroData.hero_healing), max: this.maxValue.hero_healing},
                    {axis: "obs_sen_placed", value: parseFloat(heroData.obs_sen_placed), max: this.maxValue.obs_sen_placed}
                ];

                var cfg = {
                w: 200,
                h: 200,
                margin: {top: 50, right: 80, bottom: 50, left: 80},
                levels: 3,
                labelFactor: 1.25,  // Adjust this factor to position labels further out
                wrapWidth: 60,
                opacityArea: 0.35,
                dotRadius: 4,
                opacityCircles: 0.1,
                strokeWidth: 2,
                roundStrokes: false,
                };

                const svg = d3.select("#radar-svg")
                .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
                .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
                .append("g")
                .attr("transform", `translate(${cfg.w / 2 + cfg.margin.left}, ${cfg.h / 2 + cfg.margin.top})`);

                var radius = Math.min(cfg.w / 2, cfg.h / 2);
                var angleSlice = Math.PI * 2 / radarData.length;


                const tooltip = d3.select("#tooltip");

                // Add lines and labels
                radarData.forEach(function(d, i) {
                    var x = radius * Math.cos(angleSlice * i - Math.PI/2);
                    var y = radius * Math.sin(angleSlice * i - Math.PI/2);

                    var textX = (radius+25) * Math.cos(angleSlice * i - Math.PI/2);
                    var textY = (radius+25) * Math.sin(angleSlice * i - Math.PI/2);

                    // Lines
                    svg.append("line")
                        .attr("x1", 0)
                        .attr("y1", 0)
                        .attr("x2", x)
                        .attr("y2", y)
                        .attr("stroke", "black");

                    // Labels
                    const labelGroup = svg.append("g")
                        .attr("transform", `translate(${textX}, ${textY})`);

                    // Text for the axis
                    labelGroup.append("text")
                                .text(d.axis.replace(/_/g, ' '))
                                .style("font-family", "Arial")
                                .style("font-size", "13px")
                                .attr("text-anchor", "middle")
                                .attr("alignment-baseline", "central")
                                .attr("dy", "-0.6em")  // Shift the axis label up to make room for the value below it
                                .attr("stroke-width", 1);

                    // Text for the value
                    labelGroup.append("text")
                                .text(d.value.toFixed(1))
                                .style("font-family", "Arial")
                                .style("font-size", "10px")
                                .style("font-weight", "bold")
                                .attr("text-anchor", "middle")
                                .attr("alignment-baseline", "hanging")  // Start text from the baseline to align top of text with position
                                .attr("dy", "1em");  // Shift the value label down relative to the axis label
                });

                var radarLine = d3.lineRadial()
                    .radius(d => (radius * d.value) / d.max)
                    .angle((d, i) => i * angleSlice)
                    .curve(d3.curveLinearClosed);

                svg.append("path")
                    .datum(radarData)
                    .attr("d", radarLine)
                    .attr("stroke-width", 3)
                    .attr("stroke", "orange")
                    .attr("fill", "orange")
                    .attr("fill-opacity", 0.5);
            });
        },
        showTooltip(event, d){
            this.tooltipData = d;
            this.tooltipVisible = true;
            this.moveTooltip(event);
        },
        moveTooltip(event){
            let tooltipLeft = event.pageX + 10;
            let tooltipTop = event.pageY + 10;

            // Adjust tooltip position if it's near the edges of the screen
            const tooltipWidth = 150; // Approximate tooltip width
            const tooltipHeight = 40; // Approximate tooltip height
            const padding = 10;

            // Check if the tooltip goes off the right edge
            if (tooltipLeft + tooltipWidth > window.innerWidth) {
                tooltipLeft = window.innerWidth - tooltipWidth - padding;
            }

            // Check if the tooltip goes off the bottom edge
            if (tooltipTop + tooltipHeight > window.innerHeight) {
                tooltipTop = window.innerHeight - tooltipHeight - padding;
            }

            // Set the tooltip position
            this.tooltipStyle = {
                left: `${tooltipLeft}px`,
                top: `${tooltipTop}px`,
            };
        },
        hideTooltip(event, d){
            this.tooltipVisible = false;
        },
    },
    watch: {
      'currentHero.chosenState': {
        handler() {
          this.initRadar();
        },
      },
    },
    mounted() {
        console.clear();
      this.initRadar();
    },
  };
  </script>
  
  <style scoped>
  .radar-wrapper {
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    justify-content: right;
    align-items: right;
    margin-left: 300px;
    margin-right: auto;
    height: 200vh;
    width: 100vw;
    position: relative;
  }

  .tooltip {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
   }
  </style>
  