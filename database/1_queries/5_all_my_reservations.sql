SELECT reservations.id, properties.title, start_date, cost_per_night, AVG(rating) AS average_rating
FROM properties
INNER JOIN reservations ON properties.id = property_id
JOIN property_reviews ON reservations.id = reservation_id
WHERE reservations.guest_id = 1
GROUP BY properties.id, reservations.id
ORDER BY start_date
LIMIT 10;