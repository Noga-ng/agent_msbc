import { motion } from "framer-motion"
import Chart from "react-apexcharts"

export default function DashboardChart() {
  const options = {
    chart: {
      type: "area" as const,
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: "smooth" as const,
      width: 3
    },
    xaxis: {
      categories: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"]
    }
  }

  const series = [
    {
      name: "Inscriptions",
      data: [30, 45, 38, 60, 75, 90]
    }
  ]

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
        scale: 0.97
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut"
      }}
      className="w-full rounded-2xl bg-white p-5 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold">
        Évolution des inscriptions
      </h2>

      <Chart
      options={options}
      series={series}
      type="area"
      height={350}
      />
    </motion.div>
  )
}