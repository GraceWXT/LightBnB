SELECT properties.id, title, cost_per_night, AVG(rating) AS average_rating
FROM properties
INNER JOIN property_reviews ON property_id = properties.id
WHERE city = 'Vancouver'
GROUP BY properties.id
HAVING AVG(rating) >= 4
ORDER BY cost_per_night
LIMIT 10;