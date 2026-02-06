export enum Permission {
  SysAccessDashboard = 'sys.access_dashboard',
  SysViewLogs = 'sys.view_logs',
  SysSettingsUpdate = 'sys.settings.update',

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
  OrderView = 'order.view',
  OrderUpdateStatus = 'order.update_status',
  OrderCancel = 'order.cancel',
  OrderRefund = 'order.refund',
  OrderCreate = 'order.create',

  TransactionView = 'transaction.view',

  RevenueView = 'revenue.view',

  ShipmentCreate = 'shipment.create',
  ShipmentUpdate = 'shipment.update',
  ShipmentView = 'shipment.view',

  AddressCreate = 'address.create',
  AddressView = 'address.view',
  AddressUpdate = 'address.update',
  AddressDelete = 'address.delete',

  WikiViewHidden = 'wiki.view_hidden',
  WikiCreate = 'wiki.create',
  WikiUpdate = 'wiki.update',
  WikiDelete = 'wiki.delete',
  WikiPublish = 'wiki.publish',

  ReviewView = 'review.view',
  ReviewReply = 'review.reply',
  ReviewHide = 'review.hide',

  DeviceViewAll = 'device.view_all',
  DeviceProvision = 'device.provision',
  DeviceBlock = 'device.block',
  DeviceReset = 'device.reset',
  DeviceViewLogs = 'device.view_logs',

  FirmwareView = 'firmware.view',
  FirmwareCreate = 'firmware.create',
  FirmwareDeploy = 'firmware.deploy',
  FirmwareDelete = 'firmware.delete',

  MeProfileUpdate = 'me.profile.update',
  MeOrderCreate = 'me.order.create',
  MeGardenManage = 'me.garden.manage',
  MeDeviceControl = 'me.device.control',

  UnlockRoom = 'room.unlock',
  LockRoom = 'room.lock',
}
