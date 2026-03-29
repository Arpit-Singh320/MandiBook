const { Op } = require('sequelize');
const { Booking, Notification, User } = require('../models');
const { sendEmail } = require('../config/brevo');

const uniqueById = (users = []) => {
  const seen = new Set();
  return users.filter((user) => {
    if (!user || seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  });
};

const formatCurrency = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

const sendEmailsBestEffort = async (users, subject, getHtmlContent) => {
  const recipients = users.filter((user) => user?.email);
  await Promise.all(
    recipients.map(async (user) => {
      try {
        await sendEmail(
          user.email,
          user.name || 'MandiBook User',
          subject,
          getHtmlContent(user),
        );
      } catch (error) {
        console.error(`[Notifications] Email send failed for ${user.email}:`, error.message);
      }
    }),
  );
};

const createNotifications = async (users, payload) => {
  if (!users.length) return;

  await Notification.bulkCreate(
    users.map((user) => ({
      userId: user.id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl,
    })),
  );
};

const getFarmersForPriceAlert = async ({ mandiId, crop }) => {
  const bookingRows = await Booking.findAll({
    where: { mandiId },
    attributes: ['farmerId'],
    group: ['farmerId'],
  });

  const bookingFarmerIds = bookingRows.map((row) => row.farmerId).filter(Boolean);

  const [bookedFarmers, interestedFarmers] = await Promise.all([
    bookingFarmerIds.length > 0
      ? User.findAll({
          where: {
            id: { [Op.in]: bookingFarmerIds },
            role: 'farmer',
            status: 'active',
          },
          attributes: ['id', 'name', 'email'],
        })
      : Promise.resolve([]),
    User.findAll({
      where: {
        role: 'farmer',
        status: 'active',
        [Op.or]: [
          { preferredMandis: { [Op.contains]: [mandiId] } },
          { priceAlertCrops: { [Op.contains]: [crop] } },
        ],
      },
      attributes: ['id', 'name', 'email'],
    }),
  ]);

  return uniqueById([...bookedFarmers, ...interestedFarmers]);
};

const getManagersForMandi = async (mandiId) => {
  if (!mandiId) return [];
  return User.findAll({
    where: {
      role: 'manager',
      mandiId,
      status: 'active',
    },
    attributes: ['id', 'name', 'email'],
    order: [['createdAt', 'ASC']],
  });
};

const getAllManagers = async () => User.findAll({
  where: {
    role: 'manager',
    status: 'active',
  },
  attributes: ['id', 'name', 'email', 'mandiId'],
  order: [['createdAt', 'ASC']],
});

const notifyFarmersAboutPriceChange = async ({ mandi, crop, previousPrice, currentPrice, actorName }) => {
  const farmers = await getFarmersForPriceAlert({ mandiId: mandi.id, crop });
  if (!farmers.length) return { notified: 0 };

  const title = `${crop} price updated at ${mandi.name}`;
  const message = `${actorName} updated ${crop} price at ${mandi.name} from ${formatCurrency(previousPrice)} to ${formatCurrency(currentPrice)}.`;

  await createNotifications(farmers, {
    type: 'price-alert',
    title,
    message,
    actionUrl: '/farmer/prices',
  });

  await sendEmailsBestEffort(
    farmers,
    title,
    (user) => `
      <html>
        <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 12px; color: #166534;">Price Alert from MandiBook</h2>
            <p style="margin: 0 0 12px; color: #374151;">Hello ${user.name || 'Farmer'},</p>
            <p style="margin: 0 0 12px; color: #374151;">The mandi price for <strong>${crop}</strong> at <strong>${mandi.name}</strong> has been updated.</p>
            <div style="padding: 16px; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0; margin: 16px 0;">
              <p style="margin: 0; color: #166534;"><strong>Previous price:</strong> ${formatCurrency(previousPrice)}</p>
              <p style="margin: 8px 0 0; color: #166534;"><strong>Current price:</strong> ${formatCurrency(currentPrice)}</p>
            </div>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">You can check the latest mandi prices anytime in your MandiBook farmer portal.</p>
          </div>
        </body>
      </html>
    `,
  );

  return { notified: farmers.length };
};

const notifyManagersAboutCatalogChange = async ({ crop, baselineMinPrice, baselineMaxPrice, actionLabel, actorName }) => {
  const managers = await getAllManagers();
  if (!managers.length) return { notified: 0 };

  const baselineText = baselineMaxPrice !== null && baselineMaxPrice !== undefined
    ? `${formatCurrency(baselineMinPrice)} - ${formatCurrency(baselineMaxPrice)}`
    : `${formatCurrency(baselineMinPrice)} minimum baseline`;
  const title = `Admin ${actionLabel.toLowerCase()} ${crop}`;
  const message = `${actorName} ${actionLabel.toLowerCase()} ${crop} with a baseline of ${baselineText}. Review and align mandi prices if needed.`;

  await createNotifications(managers, {
    type: 'system',
    title,
    message,
    actionUrl: '/manager/prices',
  });

  await sendEmailsBestEffort(
    managers,
    title,
    (user) => `
      <html>
        <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 12px; color: #1f2937;">Crop Catalog Update</h2>
            <p style="margin: 0 0 12px; color: #374151;">Hello ${user.name || 'Manager'},</p>
            <p style="margin: 0 0 12px; color: #374151;">${actorName} ${actionLabel.toLowerCase()} <strong>${crop}</strong> in the admin crop catalog.</p>
            <div style="padding: 16px; background: #eff6ff; border-radius: 10px; border: 1px solid #bfdbfe; margin: 16px 0;">
              <p style="margin: 0; color: #1d4ed8;"><strong>Baseline:</strong> ${baselineText}</p>
            </div>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">Please open the manager portal and review your mandi pricing for this crop.</p>
          </div>
        </body>
      </html>
    `,
  );

  return { notified: managers.length };
};

const notifyManagersAboutAdminPriceChange = async ({ mandi, crop, previousPrice, currentPrice, actorName }) => {
  const managers = await getManagersForMandi(mandi.id);
  if (!managers.length) return { notified: 0 };

  const title = `Admin updated ${crop} price at ${mandi.name}`;
  const message = `${actorName} updated ${crop} mandi price at ${mandi.name} from ${formatCurrency(previousPrice)} to ${formatCurrency(currentPrice)}.`;

  await createNotifications(managers, {
    type: 'system',
    title,
    message,
    actionUrl: '/manager/prices',
  });

  await sendEmailsBestEffort(
    managers,
    title,
    (user) => `
      <html>
        <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 12px; color: #1f2937;">Mandi Price Updated by Admin</h2>
            <p style="margin: 0 0 12px; color: #374151;">Hello ${user.name || 'Manager'},</p>
            <p style="margin: 0 0 12px; color: #374151;">${actorName} updated the mandi price for <strong>${crop}</strong> at <strong>${mandi.name}</strong>.</p>
            <div style="padding: 16px; background: #eff6ff; border-radius: 10px; border: 1px solid #bfdbfe; margin: 16px 0;">
              <p style="margin: 0; color: #1d4ed8;"><strong>Previous:</strong> ${formatCurrency(previousPrice)}</p>
              <p style="margin: 8px 0 0; color: #1d4ed8;"><strong>Current:</strong> ${formatCurrency(currentPrice)}</p>
            </div>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">Please review this update in the manager pricing page.</p>
          </div>
        </body>
      </html>
    `,
  );

  return { notified: managers.length };
};

const notifyFarmersAboutPriceRemoval = async ({ mandi, crop, actorName }) => {
  const farmers = await getFarmersForPriceAlert({ mandiId: mandi.id, crop });
  if (!farmers.length) return { notified: 0 };

  const title = `${crop} price removed at ${mandi.name}`;
  const message = `${actorName} removed the live mandi price for ${crop} at ${mandi.name}.`;

  await createNotifications(farmers, {
    type: 'price-alert',
    title,
    message,
    actionUrl: '/farmer/prices',
  });

  await sendEmailsBestEffort(
    farmers,
    title,
    (user) => `
      <html>
        <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 12px; color: #991b1b;">Price Removed from MandiBook</h2>
            <p style="margin: 0 0 12px; color: #374151;">Hello ${user.name || 'Farmer'},</p>
            <p style="margin: 0 0 12px; color: #374151;">The live mandi price for <strong>${crop}</strong> at <strong>${mandi.name}</strong> has been removed by ${actorName}.</p>
            <div style="padding: 16px; background: #fef2f2; border-radius: 10px; border: 1px solid #fecaca; margin: 16px 0; color: #991b1b;">
              Please check the farmer portal for the latest available prices before planning your mandi visit.
            </div>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">You can review all remaining mandi prices anytime in your MandiBook farmer portal.</p>
          </div>
        </body>
      </html>
    `,
  );

  return { notified: farmers.length };
};

const notifyManagersAboutCatalogDeletion = async ({ crop, actorName }) => {
  const managers = await getAllManagers();
  if (!managers.length) return { notified: 0 };

  const title = `Admin removed ${crop} from the crop catalog`;
  const message = `${actorName} removed ${crop} from the admin crop catalog and deleted its active mandi price entries.`;

  await createNotifications(managers, {
    type: 'system',
    title,
    message,
    actionUrl: '/manager/prices',
  });

  await sendEmailsBestEffort(
    managers,
    title,
    (user) => `
      <html>
        <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 12px; color: #1f2937;">Crop Catalog Removal</h2>
            <p style="margin: 0 0 12px; color: #374151;">Hello ${user.name || 'Manager'},</p>
            <p style="margin: 0 0 12px; color: #374151;">${actorName} removed <strong>${crop}</strong> from the admin crop catalog.</p>
            <div style="padding: 16px; background: #eff6ff; border-radius: 10px; border: 1px solid #bfdbfe; margin: 16px 0; color: #1d4ed8;">
              Any existing mandi price entries for this crop were removed as part of the catalog deletion.
            </div>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">Please review your manager portal and add prices only for crops that remain active in the admin catalog.</p>
          </div>
        </body>
      </html>
    `,
  );

  return { notified: managers.length };
};

const notifyManagersAboutAdminPriceRemoval = async ({ mandi, crop, actorName }) => {
  const managers = await getManagersForMandi(mandi.id);
  if (!managers.length) return { notified: 0 };

  const title = `Admin removed ${crop} price at ${mandi.name}`;
  const message = `${actorName} removed the live mandi price for ${crop} at ${mandi.name}.`;

  await createNotifications(managers, {
    type: 'system',
    title,
    message,
    actionUrl: '/manager/prices',
  });

  await sendEmailsBestEffort(
    managers,
    title,
    (user) => `
      <html>
        <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 12px; color: #1f2937;">Mandi Price Removed by Admin</h2>
            <p style="margin: 0 0 12px; color: #374151;">Hello ${user.name || 'Manager'},</p>
            <p style="margin: 0 0 12px; color: #374151;">${actorName} removed the live mandi price for <strong>${crop}</strong> at <strong>${mandi.name}</strong>.</p>
            <div style="padding: 16px; background: #eff6ff; border-radius: 10px; border: 1px solid #bfdbfe; margin: 16px 0; color: #1d4ed8;">
              Please review whether this crop should be reintroduced later or remain unavailable at your mandi.
            </div>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">Open the manager pricing page in MandiBook to review current crop coverage.</p>
          </div>
        </body>
      </html>
    `,
  );

  return { notified: managers.length };
};

module.exports = {
  notifyFarmersAboutPriceChange,
  notifyFarmersAboutPriceRemoval,
  notifyManagersAboutCatalogChange,
  notifyManagersAboutCatalogDeletion,
  notifyManagersAboutAdminPriceChange,
  notifyManagersAboutAdminPriceRemoval,
};
