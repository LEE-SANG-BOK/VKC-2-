import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

type AnswerStat = {
  author_id: string;
  answers_count: number;
  adopted_count: number;
  likes_sum: number;
};

type FollowerStat = {
  following_id: string;
  followers: number;
};

async function main() {
  const answerStats = await sql<AnswerStat[]>`
    select
      author_id,
      count(*)::int as answers_count,
      coalesce(sum((is_adopted)::int), 0)::int as adopted_count,
      coalesce(sum(likes), 0)::int as likes_sum
    from answers
    group by author_id
  `;

  const followerStats = await sql<FollowerStat[]>`
    select
      following_id,
      count(*)::int as followers
    from follows
    group by following_id
  `;

  const followerMap = new Map<string, number>();
  followerStats.forEach((row) => {
    followerMap.set(row.following_id, row.followers);
  });

  for (const stat of answerStats) {
    const followers = followerMap.get(stat.author_id) ?? 0;
    const adoptionRate = stat.answers_count > 0 ? Math.round((stat.adopted_count * 100) / stat.answers_count) : 0;
    const trustScore = Math.round(stat.adopted_count * 3 + stat.likes_sum + followers * 0.5);

    await sql`
      update users
      set
        helpful_answers = ${stat.likes_sum},
        adoption_rate = ${adoptionRate},
        trust_score = ${trustScore},
        updated_at = now()
      where id = ${stat.author_id}
    `;
  }

  console.log('Trust metrics backfill completed for', answerStats.length, 'users');
  await sql.end({ timeout: 5 });
}

main().catch(async (err) => {
  console.error(err);
  try {
    await sql.end({ timeout: 5 });
  } catch {}
  process.exit(1);
});
