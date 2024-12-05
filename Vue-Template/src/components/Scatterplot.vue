<template>
  <div class="scatterplot-wrapper">
    <!-- Button to toggle between Pick Rate and Ban Rate -->
    <button @click="toggleMetric" class="toggle-button">
      Toggle to {{ currentMetric === 'Pick Rate' ? 'Ban Rate' : 'Pick Rate' }}
    </button>

    <div class="chart-container" ref="scatterContainer">
      <svg id="scatter-svg"></svg>
    </div>

    <!-- Tooltip Element -->
    <div v-if="tooltipVisible" class="tooltip" :style="tooltipStyle">
      <strong>{{ tooltipData.heroName }}</strong><br />
      {{ currentMetric }}: {{ tooltipData.metricValue }}%<br />
      Win Rate: {{ tooltipData.winRate }}%
    </div>
  </div>
</template>

<script lang="ts">
import * as d3 from "d3";

interface HeroData {
  hero_id: string;
  pickRate: number;
  banRate: number;
  winRate: number;
}

export default {
  name: "ScatterPlot",
  data() {
    return {
      heroes: [] as HeroData[],
      sortedHeroes: [] as HeroData[],  // Array to store sorted heroes
      heroNames: {} as Record<string, string>, // Mapping hero_id to hero names
      size: { width: 0, height: 0 },
      margin: { left: 50, right: 20, top: 60, bottom: 50 },
      tooltipVisible: false,
      tooltipData: { hero_id: '', heroName: '', metricValue: 0, winRate: 0 },
      tooltipStyle: { left: '0px', top: '0px' },
      currentMetric: 'Pick Rate', // Initial metric
    };
  },
  methods: {
    loadData() {
      // Load the hero names
      d3.csv('../../data/Constants/Constants.Heroes.csv').then((heroesData) => {
        heroesData.forEach((d: any) => {
          this.heroNames[d.id] = d.localized_name;
        });

        // Load hero pick/ban rates
        d3.csv('../../data/merged_hero_data.csv', d3.autoType).then((data) => {
          this.heroes = data.map((d: any) => ({
            hero_id: d.hero_id,
            pickRate: d['Pick Rate'],
            banRate: d['Ban Rate'],
            winRate: d['Win Rate'],
          }));
          this.sortedHeroes = [...this.heroes];  // Initialize sortedHeroes
          this.initChart();
        });
      });
    },
    initChart() {
      // Clear previous chart
      d3.select("#scatter-svg").selectAll("*").remove();

      const svg = d3.select("#scatter-svg")
        .attr("width", this.size.width)
        .attr("height", this.size.height);

      svg.append("text")
        .attr("x", this.size.width / 2)
        .attr("y", this.margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Hero ${this.currentMetric} vs Win Rate`);

      const xScale = d3.scaleLinear()
        .domain([0, d3.max(this.sortedHeroes, (d) => this.getMetricValue(d))!])
        .range([this.margin.left, this.size.width - this.margin.right]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(this.sortedHeroes, (d) => d.winRate)!])
        .range([this.size.height - this.margin.bottom, this.margin.top]);

      svg.append("g")
        .attr("transform", `translate(0, ${this.size.height - this.margin.bottom})`)
        .call(d3.axisBottom(xScale).tickFormat((d) => `${d}%`));

      svg.append("g")
        .attr("transform", `translate(${this.margin.left}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat((d) => `${d}%`));

      // Create and update the circles for the scatter plot
      const circles = svg.selectAll("circle")
        .data(this.sortedHeroes);

      // Enter new circles
      circles.enter().append("circle")
        .attr("cx", (d) => xScale(this.getMetricValue(d)))
        .attr("cy", (d) => yScale(d.winRate))
        .attr("r", 5)
        .attr("fill", "teal")
        .on("mouseover", this.showTooltip)
        .on("mousemove", this.moveTooltip)
        .on("mouseout", this.hideTooltip);

      // Update existing circles
      circles.transition()
        .duration(1000)
        .attr("cx", (d) => xScale(this.getMetricValue(d)))
        .attr("cy", (d) => yScale(d.winRate));

      // Remove old circles if any
      circles.exit().remove();
    },
    showTooltip(event, d) {
      this.tooltipData = {
        hero_id: d.hero_id,
        heroName: this.heroNames[d.hero_id] || "Unknown Hero",
        metricValue: this.getMetricValue(d),
        winRate: d.winRate,
      };
      this.tooltipVisible = true;
      this.moveTooltip(event);
    },
    getMetricValue(d) {
      return this.currentMetric === 'Pick Rate' ? d.pickRate : d.banRate;
    },
    moveTooltip(event) {
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
    hideTooltip() {
      this.tooltipVisible = false;
    },
    toggleMetric() {
      this.currentMetric = this.currentMetric === 'Pick Rate' ? 'Ban Rate' : 'Pick Rate';
      this.initChart();
    },
    updateChartSize() {
      this.size = { width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 };
      this.initChart();
    },
  },
  mounted() {
    this.updateChartSize();
    this.loadData();
    window.addEventListener("resize", this.updateChartSize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateChartSize);
  },
};
</script>

<style scoped>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.scatterplot-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  position: relative;
}

.toggle-button {
  margin-bottom: 10px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

.chart-container {
  width: 100%;
  height: 100%;
}

#scatter-svg {
  display: block;
  margin: auto;
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
