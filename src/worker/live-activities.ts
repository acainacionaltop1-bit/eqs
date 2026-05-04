// Admin endpoints for managing fake live activities

import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

// Helper function to mask username (same as in main worker)
function maskUsername(name: string): string {
  if (!name || name.length <= 2) {
    return "Usuario*****";
  }
  
  // Take half of the name characters and add asterisks
  const halfLength = Math.ceil(name.length / 2);
  const firstPart = name.substring(0, halfLength);
  return `${firstPart}*****`;
}

// Admin - Get all live activities
app.get("/", async (c) => {
  try {
    const activities = await c.env.DB.prepare(`
      SELECT * FROM live_activities 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all();

    return c.json(activities.results || []);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch live activities" }, 500);
  }
});

// Admin - Create fake live activity
app.post("/", async (c) => {
  try {
    const { 
      activity_type, 
      user_name, 
      custom_message, 
      amount, 
      level_info 
    } = await c.req.json();

    if (!activity_type || !user_name) {
      return c.json({ error: "Tipo de atividade e nome do usuário são obrigatórios" }, 400);
    }

    // Mask the username
    const maskedName = maskUsername(user_name);
    
    // Generate message based on type if not provided
    let message = custom_message;
    
    if (!message) {
      switch (activity_type) {
        case 'withdrawal':
          message = `${maskedName} sacou R$ ${(amount || 50).toFixed(2)}`;
          break;
        case 'vip_purchase':
          message = `${maskedName} adquiriu ${level_info || 'VIP 1'}!`;
          break;
        case 'intermediate_purchase':
          message = `${maskedName} adquiriu plano Intermediário!`;
          break;
        case 'registration':
          message = `${maskedName} acabou de se cadastrar!`;
          break;
        case 'video_watch':
          message = `${maskedName} assistiu um vídeo e ganhou R$ ${(amount || 2).toFixed(2)}!`;
          break;
        default:
          message = `${maskedName} está usando a plataforma!`;
      }
    }

    // Insert the activity
    await c.env.DB.prepare(`
      INSERT INTO live_activities (activity_type, user_name, message, amount, level_info, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).bind(
      activity_type,
      maskedName,
      message,
      amount || null,
      level_info || null
    ).run();

    // Keep only the last 50 activities to prevent database bloat
    await c.env.DB.prepare(`
      DELETE FROM live_activities 
      WHERE id NOT IN (
        SELECT id FROM live_activities 
        ORDER BY created_at DESC 
        LIMIT 50
      )
    `).run();

    return c.json({ 
      success: true, 
      message: "Atividade criada com sucesso!",
      activity: {
        activity_type,
        user_name: maskedName,
        message,
        amount,
        level_info
      }
    });
  } catch (error: any) {
    return c.json({ error: "Failed to create live activity" }, 500);
  }
});

// Admin - Create multiple fake activities
app.post("/bulk", async (c) => {
  try {
    const { count = 10, activity_types = ['withdrawal', 'vip_purchase', 'registration'] } = await c.req.json();

    if (count < 1 || count > 50) {
      return c.json({ error: "Count deve estar entre 1 e 50" }, 400);
    }

    // Sample fake names
    const fakeNames = [
      'Ana Silva', 'Bruno Costa', 'Carla Mendes', 'Diego Santos', 'Elena Rodriguez',
      'Felipe Oliveira', 'Gabriela Lima', 'Henrique Alves', 'Isabela Rocha', 'João Pereira',
      'Kamila Ferreira', 'Lucas Martins', 'Marina Souza', 'Nicolas Barbosa', 'Olivia Castro',
      'Pedro Nascimento', 'Rafael Cardoso', 'Sophia Torres', 'Thiago Moura', 'Ursula Dias',
      'Vitor Ribeiro', 'Wendy Campos', 'Xavier Gomes', 'Yasmin Correia', 'Zara Monteiro'
    ];

    const createdActivities = [];

    for (let i = 0; i < count; i++) {
      const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const activityType = activity_types[Math.floor(Math.random() * activity_types.length)];
      const maskedName = maskUsername(name);
      
      let message = '';
      let amount = null;
      let levelInfo = null;

      switch (activityType) {
        case 'withdrawal':
          amount = Math.floor(Math.random() * 200) + 20; // R$20-220
          message = `${maskedName} sacou R$ ${amount.toFixed(2)}`;
          break;
        case 'vip_purchase':
          const vipLevel = Math.floor(Math.random() * 6) + 1; // VIP 1-6
          levelInfo = `VIP ${vipLevel}`;
          amount = vipLevel * 150; // Approximate VIP cost
          message = `${maskedName} adquiriu VIP ${vipLevel}!`;
          break;
        case 'intermediate_purchase':
          amount = 97.90;
          message = `${maskedName} adquiriu plano Intermediário!`;
          break;
        case 'registration':
          message = `${maskedName} acabou de se cadastrar!`;
          break;
        case 'video_watch':
          amount = 2.0 + (Math.random() * 3); // R$2.00-5.00
          message = `${maskedName} assistiu um vídeo e ganhou R$ ${amount.toFixed(2)}!`;
          break;
      }

      await c.env.DB.prepare(`
        INSERT INTO live_activities (activity_type, user_name, message, amount, level_info, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(activityType, maskedName, message, amount, levelInfo).run();

      createdActivities.push({
        activity_type: activityType,
        user_name: maskedName,
        message,
        amount,
        level_info: levelInfo
      });

      // Add small delay to create realistic timestamps
      await new Promise(resolve => {
        const delay = Math.random() * 100;
        const start = Date.now();
        while (Date.now() - start < delay) {
          // Simple busy wait for small delay
        }
        resolve(undefined);
      });
    }

    // Keep only the last 50 activities
    await c.env.DB.prepare(`
      DELETE FROM live_activities 
      WHERE id NOT IN (
        SELECT id FROM live_activities 
        ORDER BY created_at DESC 
        LIMIT 50
      )
    `).run();

    return c.json({
      success: true,
      message: `${count} atividades criadas com sucesso!`,
      activities: createdActivities
    });
  } catch (error: any) {
    return c.json({ error: "Failed to create bulk activities" }, 500);
  }
});

// Admin - Delete live activity
app.delete("/:id", async (c) => {
  try {
    const activityId = parseInt(c.req.param('id'));
    
    await c.env.DB.prepare("DELETE FROM live_activities WHERE id = ?").bind(activityId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to delete live activity" }, 500);
  }
});

// Admin - Clear all live activities
app.delete("/", async (c) => {
  try {
    await c.env.DB.prepare("DELETE FROM live_activities").run();
    
    return c.json({ success: true, message: "Todas as atividades foram deletadas" });
  } catch (error: any) {
    return c.json({ error: "Failed to clear live activities" }, 500);
  }
});

// Admin - Toggle activity status
app.patch("/:id/toggle", async (c) => {
  try {
    const activityId = parseInt(c.req.param('id'));
    
    await c.env.DB.prepare(`
      UPDATE live_activities 
      SET is_active = NOT is_active, updated_at = datetime('now')
      WHERE id = ?
    `).bind(activityId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to toggle activity status" }, 500);
  }
});

export { app as liveActivitiesRouter };
