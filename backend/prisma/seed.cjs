const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const questions = [
    {
      code: "Q1_TESTING_QUALITY",
      section: "SECTION_1",
      text: "Эффективность и качество тестирования",
      weightPercent: 49,
      sortOrder: 1
    },
    {
      code: "Q2_DEADLINE",
      section: "SECTION_1",
      text: "Соблюдение сроков",
      weightPercent: 21,
      sortOrder: 2
    },
    {
      code: "Q3_DISCIPLINE",
      section: "SECTION_2",
      text: "Дисциплина и пунктуальность",
      weightPercent: 18,
      sortOrder: 3
    },
    {
      code: "Q4_INITIATIVE",
      section: "SECTION_2",
      text: "Инициативность",
      weightPercent: 6,
      sortOrder: 4
    },
    {
      code: "Q5_COMMUNICATION",
      section: "SECTION_2",
      text: "Коммуникация и командная работа",
      weightPercent: 6,
      sortOrder: 5
    }
  ];

  for (const question of questions) {
    await prisma.kpiQuestion.upsert({
      where: { code: question.code },
      create: question,
      update: question
    });
  }

  console.log("KPI questions seeded.");
}

main()
  .catch((error) => {
    console.error("Failed to seed KPI questions", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
