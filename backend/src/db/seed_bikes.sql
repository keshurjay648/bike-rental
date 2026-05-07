INSERT INTO bikes (name, brand, type, image_url, price_per_hour, availability_status) VALUES
('BMW G310', 'BMW', 'Naked', 'img/g310.png', 500, 'available'),
('TVS RR310', 'TVS', 'Sports', 'img/tvsrr.png', 450, 'available'),
('TVS RTR160', 'TVS', 'Naked', 'img/rtr160.png', 300, 'available'),
('BMW GS310', 'BMW', 'Adventure', 'img/gs310.png', 600, 'available'),
('Honda CBR600rr', 'Honda', 'Sports', 'img/cbr.png', 950, 'available'),
('Yamaha Aerox 155', 'Yamaha', 'Scooter', 'img/yama.png', 350, 'available'),
('Honda PCX', 'Honda', 'Scooter', 'img/pcx.png', 450, 'available'),
('Burgman 400', 'Suzuki', 'Scooter', 'img/burg.png', 600, 'available')
('LiveWire', 'Harley Davidson', 'Adventure' , 'img\harly.png' '900' , 'available' )
ON CONFLICT DO NOTHING;
