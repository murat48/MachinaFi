;; MachineNet Payment Contract
;; Optional Clarity contract for on-chain payment verification

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INSUFFICIENT_BALANCE (err u101))
(define-constant ERR_INVALID_AMOUNT (err u102))

;; Data maps
(define-map service-payments
  { tx-id: (buff 32) }
  {
    sender: principal,
    receiver: principal,
    amount: uint,
    service-id: (string-ascii 64),
    timestamp: uint,
    verified: bool,
  }
)

(define-map device-balances
  { device: principal }
  { balance: uint }
)

;; Read-only functions
(define-read-only (get-payment (tx-id (buff 32)))
  (map-get? service-payments { tx-id: tx-id })
)

(define-read-only (get-device-balance (device principal))
  (default-to { balance: u0 } (map-get? device-balances { device: device }))
)

;; Public functions
(define-public (register-payment
    (tx-id (buff 32))
    (receiver principal)
    (amount uint)
    (service-id (string-ascii 64))
  )
  (begin
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts!
      (not (is-eq tx-id
        0x0000000000000000000000000000000000000000000000000000000000000000
      ))
      ERR_INVALID_AMOUNT
    )
    (asserts! (not (is-eq receiver tx-sender)) ERR_UNAUTHORIZED)
    (asserts! (> (len service-id) u0) ERR_INVALID_AMOUNT)
    (map-set service-payments { tx-id: tx-id } {
      sender: tx-sender,
      receiver: receiver,
      amount: amount,
      service-id: service-id,
      timestamp: block-height,
      verified: true,
    })
    (ok true)
  )
)

(define-public (deposit (amount uint))
  (let ((current-balance (get balance (get-device-balance tx-sender))))
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (map-set device-balances { device: tx-sender } { balance: (+ current-balance amount) })
    (ok true)
  )
)
