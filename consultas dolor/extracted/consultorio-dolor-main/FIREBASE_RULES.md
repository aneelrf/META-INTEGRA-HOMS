rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function authEmail() {
      return request.auth.token.email;
    }

    // EDITA ESTA SECCION: agrega aqui los correos autorizados por rol.
    function isAdminEmail() {
      return authEmail() in [
        'admin@consultorio.com'
      ];
    }

    function isMedicoEmail() {
      return authEmail() in [
        'medico@consultorio.com'
      ];
    }

    function isSecretariaEmail() {
      return authEmail() in [
        'secretaria@consultorio.com'
      ];
    }

    function hardcodedRole() {
      return isAdminEmail() ? 'admin'
        : isMedicoEmail() ? 'medico'
        : isSecretariaEmail() ? 'secretaria'
        : null;
    }

    function isAllowedEmail() {
      return isSignedIn() && hardcodedRole() != null;
    }

    function userPath() {
      return /databases/$(database)/documents/users/$(request.auth.uid);
    }

    function userDoc() {
      return get(userPath());
    }

    function isActiveUser() {
      return isAllowedEmail()
        && exists(userPath())
        && userDoc().data.active == true
        && userDoc().data.role == hardcodedRole()
        && userDoc().data.email == authEmail();
    }

    function roleIs(role) {
      return isActiveUser() && hardcodedRole() == role;
    }

    function roleIn(roles) {
      return isActiveUser() && hardcodedRole() in roles;
    }

    match /users/{uid} {
      allow read: if (isAllowedEmail() && request.auth.uid == uid)
        || (isActiveUser() && roleIs('admin'));

      allow create: if isAllowedEmail()
        && request.auth.uid == uid
        && request.resource.data.email == authEmail()
        && request.resource.data.role == hardcodedRole()
        && request.resource.data.active == true;

      allow update, delete: if roleIs('admin');
    }

    match /clinic_settings/{docId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico']);
    }

    match /patients/{patientId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico', 'secretaria']);
    }

    match /appointments/{appointmentId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico', 'secretaria']);
    }

    match /consultations/{consultationId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico']);
    }

    match /historias_clinicas/{historiaId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico']);
    }

    match /procedures/{procedureId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico']);
    }

    match /medications/{medicationId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico']);
    }

    match /medication_titrations/{titrationId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico']);
    }

    match /budgets/{budgetId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico', 'secretaria']);
    }

    match /invoices/{invoiceId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico', 'secretaria']);
    }

    match /payments/{paymentId} {
      allow read: if isActiveUser();
      allow write: if roleIn(['admin', 'medico', 'secretaria']);
    }
  }
}
