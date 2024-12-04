<template>
    <div class="scatterplot-wrapper">
      <div class="chart-container" ref="scatterContainer">
        <svg id="scatter-svg"></svg>
      </div>
      <!-- Tooltip Element -->
      <div v-if="tooltipVisible" class="tooltip" :style="tooltipStyle">
        <strong>Hero {{ tooltipData.hero_id }}</strong><br>
        Pick Rate: {{ tooltipData.pickRate }}%<br>
        Win Rate: {{ tooltipData.winRate }}%
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import * as d3 from "d3";
  
  interface HeroData {
    hero_id: string;
    pickRate: number;
    winRate: number;
  }
  
  export default {
    name: "ScatterPlot",
    data() {
      return {
        heroes: [] as HeroData[],
        size: { width: 0, height: 0 },
        margin: { left: 50, right: 20, top: 30, bottom: 50 },
        tooltipVisible: false,
        tooltipData: { hero_id: '', pickRate: 0, winRate: 0 },
        tooltipStyle: { left: '0px', top: '0px' }
      };
    },
    methods: {
      loadData() {
        d3.csv('../../data/hero_pick_ban_rates.csv', d3.autoType).then(data => {
          this.heroes = data.map((d: any) => ({
            hero_id: d.hero_id,
            pickRate: d['Pick Rate'],
            winRate: d['Win Rate'] || 50 // Assuming a default value if missing
          }));
          this.initChart();
        });
      },
      initChart() {
        const svg = d3.select("#scatter-svg")
          .attr("width", this.size.width)
          .attr("height", this.size.height);

        // Append title
        svg.append("text")
          .attr("x", this.size.width / 2)
          .attr("y", this.margin.top / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .text("Hero Pick Rate vs Win Rate");

        const xScale = d3.scaleLinear()
          .domain([0, d3.max(this.heroes, d => d.pickRate)!])
          .range([this.margin.left, this.size.width - this.margin.right]);

        const yScale = d3.scaleLinear()
          .domain([0, d3.max(this.heroes, d => d.winRate)!])
          .range([this.size.height - this.margin.bottom, this.margin.top]);

        svg.append("g")
          .attr("transform", `translate(0, ${this.size.height - this.margin.bottom})`)
          .call(d3.axisBottom(xScale).tickFormat(d => `${d}%`));

        svg.append("g")
          .attr("transform", `translate(${this.margin.left}, 0)`)
          .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`));

        svg.selectAll("circle")
          .data(this.heroes)
          .enter()
          .append("circle")
          .attr("cx", d => xScale(d.pickRate))
          .attr("cy", d => yScale(d.winRate))
          .attr("r", 5)
          .attr("fill", "teal")
          .on("mouseover", this.showTooltip)
          .on("mousemove", this.moveTooltip)
          .on("mouseout", this.hideTooltip);
        },
      showTooltip(event, d) {
        this.tooltipData = { hero_id: d.hero_id, pickRate: d.pickRate, winRate: d.winRate };
        this.tooltipVisible = true;
        this.moveTooltip(event);
      },
      moveTooltip(event) {
        this.tooltipStyle = {
          left: `${event.pageX + 10}px`,
          top: `${event.pageY + 10}px`
        };
      },
      hideTooltip() {
        this.tooltipVisible = false;
      }
    },
    mounted() {
      this.size = { width: this.$refs.scatterContainer.clientWidth, height: 400 };
      this.loadData();
    }
  };
  </script>
  
  <style scoped>
  .scatterplot-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  .chart-container {
    width: 100%;
    height: 100%;
    border: 1px solid #ccc;
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
  