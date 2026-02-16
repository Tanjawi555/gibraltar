export type Language = 'ar' | 'en' | 'fr';

export interface Translations {
  search_client: string;
  app_name: string;
  login: string;
  logout: string;
  username: string;
  password: string;
  login_btn: string;
  invalid_credentials: string;
  dashboard: string;
  cars: string;
  clients: string;
  rentals: string;
  documents: string;
  expenses: string;
  profits: string;
  total_clients: string;
  total_cars: string;
  total_rentals: string;
  available: string;
  rented: string;
  reserved: string;
  returned: string;
  total_expenses: string;
  total_revenue: string;
  total_profit: string;
  notifications: string;
  start_today: string;
  start_tomorrow: string;
  return_today: string;
  overdue: string;
  no_notifications: string;
  add_car: string;
  car_model: string;
  plate_number: string;
  status: string;
  actions: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  edit_rental: string;
  confirm_delete: string;
  add_client: string;
  full_name: string;
  passport_id: string;
  driving_license: string;
  passport_image: string;
  license_image: string;
  upload: string;
  view_document: string;
  no_image: string;
  add_rental: string;
  select_car: string;
  select_client: string;
  start_date: string;
  return_date: string;
  rental_price: string;
  mark_rented: string;
  mark_returned: string;
  rental_duration: string;
  add_expense: string;
  category: string;
  amount: string;
  date: string;
  link_car: string;
  description: string;
  maintenance: string;
  insurance: string;
  fuel: string;
  other: string;
  no_car: string;
  profit_overview: string;
  revenue: string;
  net_profit: string;
  language: string;
  arabic: string;
  english: string;
  french: string;
  welcome: string;
  no_data: string;
  success: string;
  error: string;
  file_too_large: string;
  invalid_file_type: string;
  cat_local: string;
  cat_wifi: string;
  cat_orange: string;
  cat_oil: string;
  cat_belt: string;
  cat_tires: string;
  cat_tax: string;
  cat_cnss: string;
  search_placeholder: string;
  more: string;
  front: string;
  back: string;
  contract: string;
  payment_info: string;
  total_amount: string;
  paid_amount: string;
  remaining_amount: string;
  print_contract: string;
  signature: string;
  terms: string;
  address: string;
  id_number: string;
  passport_number: string;
  license_number: string;
  date_of_birth: string;
  license_expiry: string;
  passport_expiry: string;
  mot_expiry: string;
  service_technic: string;
  mot_expired: string;
  mot_expiring_soon: string;
  fill_required: string;
}

const TRANSLATIONS: Record<Language, Translations> = {
  ar: {
    app_name: 'نظام تأجير السيارات',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    login_btn: 'دخول',
    invalid_credentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    dashboard: 'لوحة التحكم',
    cars: 'السيارات',
    clients: 'العملاء',
    rentals: 'الإيجارات',
    documents: 'المستندات',
    expenses: 'المصاريف',
    profits: 'الأرباح',
    total_clients: 'إجمالي العملاء',
    total_cars: 'إجمالي السيارات',
    total_rentals: 'إجمالي الإيجارات',
    available: 'متاحة',
    rented: 'مؤجرة',
    reserved: 'محجوزة',
    returned: 'مُعادة',
    total_expenses: 'إجمالي المصاريف',
    total_revenue: 'إجمالي الإيرادات',
    total_profit: 'صافي الربح',
    notifications: 'الإشعارات',
    start_today: 'حجز يبدأ اليوم',
    start_tomorrow: 'حجز يبدأ غداً',
    return_today: 'إرجاع مستحق اليوم',
    overdue: 'متأخر عن موعد الإرجاع',
    no_notifications: 'لا توجد إشعارات',
    add_car: 'إضافة سيارة',
    car_model: 'موديل السيارة',
    plate_number: 'رقم اللوحة',
    status: 'الحالة',
    actions: 'الإجراءات',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    edit_rental: 'تعديل الإيجار',
    confirm_delete: 'هل أنت متأكد من الحذف؟',
    add_client: 'إضافة عميل',
    full_name: 'الاسم الكامل',
    passport_id: 'رقم جواز السفر / الهوية',
    driving_license: 'رقم رخصة القيادة',
    passport_image: 'صورة جواز السفر / الهوية',
    license_image: 'صورة رخصة القيادة',
    upload: 'رفع',
    view_document: 'عرض المستند',
    no_image: 'لا توجد صورة',
    add_rental: 'إضافة إيجار',
    select_car: 'اختر السيارة',
    select_client: 'اختر العميل',
    start_date: 'تاريخ البداية',
    return_date: 'تاريخ الإرجاع',
    rental_price: 'سعر الإيجار',
    mark_rented: 'تحويل إلى مؤجرة',
    mark_returned: 'تحويل إلى مُعادة',
    rental_duration: 'المدة (أيام)',
    add_expense: 'إضافة مصروف',
    category: 'الفئة',
    amount: 'المبلغ',
    date: 'التاريخ',
    link_car: 'ربط بسيارة (اختياري)',
    description: 'الوصف',
    maintenance: 'صيانة',
    insurance: 'تأمين',
    fuel: 'وقود',
    other: 'أخرى',
    no_car: 'بدون سيارة',
    profit_overview: 'نظرة عامة على الأرباح',
    revenue: 'الإيرادات',
    net_profit: 'صافي الربح',
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    french: 'Français',
    welcome: 'مرحباً',
    no_data: 'لا توجد بيانات',
    success: 'تمت العملية بنجاح',
    error: 'حدث خطأ',
    file_too_large: 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)',
    invalid_file_type: 'نوع الملف غير مسموح (الصور فقط)',
    cat_local: 'محلي',
    cat_wifi: 'واي فاي',
    cat_orange: 'شبكة أورنج',
    cat_oil: 'تغيير زيت',
    cat_belt: 'سير التايمن',
    cat_tires: 'إطارات',
    cat_tax: 'ضريبة',
    cat_cnss: 'كازنوس',
    search_placeholder: 'بحث في الإيجارات...',
    more: 'المزيد',
    front: 'أمامي',
    back: 'خلفي',
    contract: 'عقد إيجار',
    payment_info: 'معلومات الدفع',
    total_amount: 'المبلغ الإجمالي',
    paid_amount: 'المبلغ المدفوع',
    remaining_amount: 'المبلغ المتبقي',
    print_contract: 'طباعة العقد',
    signature: 'الإمضاء',
    terms: 'الشروط والأحكام',
    address: 'العنوان',
    id_number: 'رقم الهوية',
    passport_number: 'رقم جواز السفر',
    license_number: 'رقم رخصة القيادة',
    date_of_birth: 'تاريخ الميلاد',
    license_expiry: 'تاريخ انتهاء الرخصة',
    passport_expiry: 'تاريخ انتهاء الجواز',
    mot_expiry: 'انتهاء الفحص الفني',
    service_technic: 'الصيانة الفنية',
    mot_expired: 'انتهى الفحص الفني',
    mot_expiring_soon: 'الفحص ينتهي قريباً',
    fill_required: 'يرجى ملء جميع الحقول المطلوبة',
  },
  en: {
    app_name: 'Car Rental System',
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    login_btn: 'Login',
    invalid_credentials: 'Invalid username or password',
    dashboard: 'Dashboard',
    cars: 'Cars',
    clients: 'Clients',
    rentals: 'Rentals',
    documents: 'Documents',
    expenses: 'Expenses',
    profits: 'Profits',
    total_clients: 'Total Clients',
    total_cars: 'Total Cars',
    total_rentals: 'Total Rentals',
    available: 'Available',
    rented: 'Rented',
    reserved: 'Reserved',
    returned: 'Returned',
    total_expenses: 'Total Expenses',
    total_revenue: 'Total Revenue',
    total_profit: 'Net Profit',
    notifications: 'Notifications',
    start_today: 'Reservation starting today',
    start_tomorrow: 'Reservation starting tomorrow',
    return_today: 'Return due today',
    overdue: 'Overdue return',
    no_notifications: 'No notifications',
    add_car: 'Add Car',
    car_model: 'Car Model',
    plate_number: 'Plate Number',
    status: 'Status',
    actions: 'Actions',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    edit_rental: 'Edit Rental',
    confirm_delete: 'Are you sure you want to delete?',
    add_client: 'Add Client',
    full_name: 'Full Name',
    passport_id: 'Passport / ID Number',
    driving_license: 'Driving License Number',
    passport_image: 'Passport / ID Image',
    license_image: 'Driving License Image',
    upload: 'Upload',
    view_document: 'View Document',
    no_image: 'No image',
    add_rental: 'Add Rental',
    select_car: 'Select Car',
    select_client: 'Select Client',
    start_date: 'Start Date',
    return_date: 'Return Date',
    rental_price: 'Rental Price',
    mark_rented: 'Mark as Rented',
    mark_returned: 'Mark as Returned',
    rental_duration: 'Duration (Days)',
    add_expense: 'Add Expense',
    category: 'Category',
    amount: 'Amount',
    date: 'Date',
    link_car: 'Link to Car (optional)',
    description: 'Description',
    maintenance: 'Maintenance',
    insurance: 'Insurance',
    fuel: 'Fuel',
    other: 'Other',
    no_car: 'No car',
    profit_overview: 'Profit Overview',
    revenue: 'Revenue',
    net_profit: 'Net Profit',
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    french: 'Français',
    welcome: 'Welcome',
    no_data: 'No data available',
    success: 'Operation successful',
    error: 'An error occurred',
    file_too_large: 'File too large (max 5MB)',
    invalid_file_type: 'Invalid file type (images only)',
    cat_local: 'Local',
    cat_wifi: 'WIFI',
    cat_orange: 'Orange network',
    cat_oil: 'Oil change',
    cat_belt: 'timing Belt',
    cat_tires: 'tires',
    cat_tax: 'Tax',
    cat_cnss: 'CNSS',
    search_placeholder: 'Search rentals...',
    more: 'Menu',
    front: 'Front',
    back: 'Back',
    contract: 'Rental Contract',
    payment_info: 'Payment Info',
    total_amount: 'Total Amount',
    paid_amount: 'Paid Amount',
    remaining_amount: 'Remaining Amount',
    print_contract: 'Print Contract',
    signature: 'Signature',
    terms: 'Terms & Conditions',
    address: 'Address',
    id_number: 'ID Number',
    passport_number: 'Passport Number',
    license_number: 'License Number',
    date_of_birth: 'Date of Birth',
    license_expiry: 'License Expiry',
    passport_expiry: 'Passport Expiry',
    mot_expiry: 'MOT Expiry',
    service_technic: 'Technical Service',
    mot_expired: 'MOT Expired',
    mot_expiring_soon: 'MOT Expiring Soon',
    fill_required: 'Please fill all required fields',
  },
  fr: {
    app_name: 'Système de Location de Voitures',
    login: 'Connexion',
    logout: 'Déconnexion',
    username: "Nom d'utilisateur",
    password: 'Mot de passe',
    login_btn: 'Se connecter',
    invalid_credentials: "Nom d'utilisateur ou mot de passe incorrect",
    dashboard: 'Tableau de Bord',
    cars: 'Voitures',
    clients: 'Clients',
    rentals: 'Locations',
    documents: 'Documents',
    expenses: 'Dépenses',
    profits: 'Bénéfices',
    total_clients: 'Total Clients',
    total_cars: 'Total Voitures',
    total_rentals: 'Total Locations',
    available: 'Disponible',
    rented: 'Louée',
    reserved: 'Réservée',
    returned: 'Rendue',
    total_expenses: 'Total Dépenses',
    total_revenue: 'Total Revenus',
    total_profit: 'Bénéfice Net',
    notifications: 'Notifications',
    start_today: "Réservation commence aujourd'hui",
    start_tomorrow: 'Réservation commence demain',
    return_today: "Retour prévu aujourd'hui",
    overdue: 'Retour en retard',
    no_notifications: 'Aucune notification',
    add_car: 'Ajouter Voiture',
    car_model: 'Modèle',
    plate_number: "Numéro d'immatriculation",
    status: 'Statut',
    actions: 'Actions',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    edit_rental: 'Modifier Location',
    confirm_delete: 'Êtes-vous sûr de vouloir supprimer?',
    add_client: 'Ajouter Client',
    full_name: 'Nom Complet',
    passport_id: 'Numéro Passeport / ID',
    driving_license: 'Numéro Permis de Conduire',
    passport_image: 'Image Passeport / ID',
    license_image: 'Image Permis de Conduire',
    upload: 'Télécharger',
    view_document: 'Voir Document',
    no_image: "Pas d'image",
    add_rental: 'Ajouter Location',
    select_car: 'Sélectionner Voiture',
    select_client: 'Sélectionner Client',
    start_date: 'Date de Début',
    return_date: 'Date de Retour',
    rental_price: 'Prix de Location',
    mark_rented: 'Marquer Louée',
    mark_returned: 'Marquer Rendue',
    rental_duration: 'Durée (Jours)',
    add_expense: 'Ajouter Dépense',
    category: 'Catégorie',
    amount: 'Montant',
    date: 'Date',
    link_car: 'Lier à Voiture (optionnel)',
    description: 'Description',
    maintenance: 'Maintenance',
    insurance: 'Assurance',
    fuel: 'Carburant',
    other: 'Autre',
    no_car: 'Sans voiture',
    profit_overview: 'Aperçu des Bénéfices',
    revenue: 'Revenus',
    net_profit: 'Bénéfice Net',
    language: 'Langue',
    arabic: 'العربية',
    english: 'English',
    french: 'Français',
    welcome: 'Bienvenue',
    no_data: 'Aucune donnée disponible',
    success: 'Opération réussie',
    error: 'Une erreur est survenue',
    file_too_large: 'Fichier trop volumineux (max 5Mo)',
    invalid_file_type: 'Type de fichier invalide (images uniquement)',
    cat_local: 'Local',
    cat_wifi: 'WIFI',
    cat_orange: 'Réseau Orange',
    cat_oil: 'Vidange',
    cat_belt: 'Courroie de distribution',
    cat_tires: 'Pneus',
    cat_tax: 'Taxe',
    cat_cnss: 'CNSS',
    search_placeholder: 'Rechercher des locations...',
    more: 'Menu',
    front: 'Recto',
    back: 'Verso',
    contract: 'Contrat de Location',
    payment_info: 'Infos Paiement',
    total_amount: 'Montant Total',
    paid_amount: 'Montant Payé',
    remaining_amount: 'Reste à Payer',
    print_contract: 'Imprimer Contrat',
    signature: 'Signature',
    terms: 'Termes et Conditions',
    address: 'Adresse',
    id_number: "Numéro d'identité",
    passport_number: 'Numéro de passeport',
    license_number: 'Numéro de permis',
    date_of_birth: 'Date de naissance',
    license_expiry: 'Expiration du permis',
    passport_expiry: 'Expiration du passeport',
    mot_expiry: 'Expiration Visite Technique',
    service_technic: 'Service Technique',
    mot_expired: 'Visite Technique Expirée',
    mot_expiring_soon: 'Visite Technique Expire Bientôt',
    fill_required: 'Veuillez remplir tous les champs obligatoires',
  },
};

export function getTranslations(lang: Language): Translations {
  return TRANSLATIONS[lang] || TRANSLATIONS.ar;
}

export function isRTL(lang: Language): boolean {
  return lang === 'ar';
}
