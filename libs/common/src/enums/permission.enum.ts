export enum Permission {
  SysAccessDashboard = 'sys.access_dashboard',
  SysViewLogs = 'sys.view_logs',
  SysSettingsUpdate = 'sys.settings.update',
  SysDataExport = 'sys.data.export',

  UserView = 'user.view',
  UserCreate = 'user.create',
  UserUpdate = 'user.update',
  UserBlock = 'user.block',
  UserDelete = 'user.delete',

  RoleView = 'role.view',
  RoleCreate = 'role.create',
  RoleUpdate = 'role.update',
  RoleDelete = 'role.delete',

  ProductView = 'product.view',
  ProductCreate = 'product.create',
  ProductUpdate = 'product.update',
  ProductStockAdjust = 'product.stock_adjust',
  ProductPublish = 'product.publish',
  ProductDelete = 'product.delete',

  CartView = 'cart.view',
  CartCreate = 'cart.create',
  CartUpdate = 'cart.update',
  CartDelete = 'cart.delete',

  CategoryManage = 'category.manage',

  OrderViewAll = 'order.view_all',
  OrderUpdateStatus = 'order.update_status',
  OrderCancel = 'order.cancel',
  OrderRefund = 'order.refund',

  TransactionView = 'transaction.view',
  RevenueView = 'revenue.view',

  ShipmentCreate = 'shipment.create',
  ShipmentUpdate = 'shipment.update',

  WikiViewHidden = 'wiki.view_hidden',
  WikiCreate = 'wiki.create',
  WikiUpdate = 'wiki.update',
  WikiDelete = 'wiki.delete',
  WikiPublish = 'wiki.publish',

  ReviewView = 'review.view',
  ReviewReply = 'review.reply',
  ReviewHide = 'review.hide',

  MarketingVoucherView = 'marketing.voucher.view',
  MarketingVoucherManage = 'marketing.voucher.manage',
  MarketingCampaignManage = 'marketing.campaign.manage',

  MediaUpload = 'media.upload',
  MediaDelete = 'media.delete',

  NotificationSend = 'notification.send',

  DeviceViewAll = 'device.view_all',
  DeviceProvision = 'device.provision',
  DeviceActivate = 'device.activate',
  DeviceBlock = 'device.block',
  DeviceReset = 'device.reset',
  DeviceViewLogs = 'device.view_logs',
  DeviceAssignZone = 'device.assign_zone',

  FirmwareView = 'firmware.view',
  FirmwareCreate = 'firmware.create',
  FirmwareDeploy = 'firmware.deploy',
  FirmwareDelete = 'firmware.delete',

  MeProfileUpdate = 'me.profile.update',
  MeOrderCreate = 'me.order.create',
  MeGardenManage = 'me.garden.manage',
  MeDeviceControl = 'me.device.control',

  ZoneCreate = 'zone.create',
  ZoneRead = 'zone.read',
  MyPlantCreate = 'my_plant.create',

  UnlockRoom = 'room.unlock',
  LockRoom = 'room.lock',
}
