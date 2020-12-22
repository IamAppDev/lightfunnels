const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('lightfunnels', 'root', 'none', {
	host: 'localhost',
	dialect: 'mysql'
});

const products = sequelize.define('products', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	title: {
		type: DataTypes.STRING
	}
});

const images = sequelize.define('images', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		allowNull: false
	},
	url: {
		type: DataTypes.STRING
	}
});

const variants = sequelize.define('variants', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		allowNull: false
	},
	title: {
		type: DataTypes.STRING
	},
	price: {
		type: DataTypes.DECIMAL(10, 2)
	}
});

const products_images = sequelize.define('products_images', {});

variants.belongsTo(images);
images.hasOne(variants);
products.belongsToMany(images, { through: products_images });
images.belongsToMany(products, { through: products_images });

(async function fn() {
	try {
		await sequelize.authenticate();
		console.log('Connection has been established successfully.');
		sequelize.sync({ force: true });
	} catch (error) {
		console.error('Unable to connect to the database:', error);
	}

	axios.get('https://www.aliexpress.com/item/4001150025635.html').then((res) => {
		let data = res.data;
		let d = data.substring(data.indexOf('data: '), data.indexOf('csrfToken'));
		const pureData = JSON.parse(d.substring(6, d.lastIndexOf(',')));

		const title = pureData.pageModule.title;
		const url = pureData.pageModule.imagePath;

		(async function go() {
			const transaction = await sequelize.transaction();
			try {
				const product = await products.create({ title }, { transaction });
				const image = await images.create({ url }, { transaction });
				await products_images.create(
					{
						productId: product.id,
						imageId: image.id
					},
					{ transaction }
				);

				await transaction.commit();
			} catch (err) {
				console.log(err);
				await transaction.rollback();
			}
		})();
	});
})();
